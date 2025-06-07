import React, { useState, useEffect, useRef } from 'react';

export default function QuizInterativo() {
  const [quizList, setQuizList] = useState([]);
  const [quizLengths, setQuizLengths] = useState({});  
  const [quizData, setQuizData] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const tooltipRef = useRef(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUserArea, setShowUserArea] = useState(false);
  const [forceUnansweredJump, setForceUnansweredJump] = useState(false);
  const [refreshUserArea, setRefreshUserArea] = useState(false);

  const shuffleArray = (array) => {
    return array.map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = shuffleArray(parseQuiz(text));
      setQuizData(parsed);
      setQuizTitle(file.name.replace(".txt", "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()));
      setCurrent(0);
      setAnswers(new Array(parsed.length).fill(undefined));
      setSelected(null);
      setShowFeedback(false);
      setShowResult(false);
      setScore(0);
// Remover apenas o quiz com o mesmo título, após já ter sido definido
const title = file.name.replace(".txt", "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
setQuizTitle(title);

// Delay o filtro até o próximo useEffect ou no final do upload
setTimeout(() => {
  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== title);
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
}, 0);

    };
    reader.readAsText(file);
  };

  const parseQuiz = (text) => {
    const blocks = text.split(/\n(?=P: )/);
    return blocks.map((block) => {
      const lines = block.trim().split('\n');
      const questionLines = [];
      let i = 0;
  
      while (i < lines.length && !/^A\)/.test(lines[i])) {
        questionLines.push(lines[i]);
        i++;
      }
  
      const question = questionLines.join('\n').replace('P: ', '').trim();
      const options = shuffleArray(lines.slice(1).filter(line => /^[A-Z]\)/.test(line)));
      const answerLine = lines.find(line => line.startsWith('R:'));
      const explanationIndex = lines.findIndex(line => line.startsWith('E:'));
      const explanationLines = explanationIndex !== -1 ? lines.slice(explanationIndex) : [];
      const explanation = explanationLines.map(line => line.replace(/^E:\s?/, '')).join('\n').trim();      
      const answer = answerLine?.replace('R:', '').trim();
      return { question, options, answer, explanation };
    });
  };

useEffect(() => {
  if (quizData.length === 0) return;

  const allAnswered = answers.length === quizData.length && answers.every(a => a !== undefined);
  if (allAnswered) return;

  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== quizTitle);
  updated.unshift({
    title: quizTitle,
    current,
    answers,
    score,
    quizData,
    date: new Date().toISOString()
  });
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated.slice(0, 10)));
}, [current, answers, score, quizData]);


  useEffect(() => {
    fetch("/quizzes/index.json")
      .then((res) => res.json())
      .then(async (data) => {
        setCategories(data);
        const lengths = {};
        for (const quizzes of Object.values(data)) {
          for (const file of quizzes) {
            const res = await fetch(`/quizzes/${file}`);
            const text = await res.text();
            const parsed = parseQuiz(text);
            lengths[file] = parsed.length;
          }
        }
        setQuizLengths(lengths);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
  if (forceUnansweredJump) {
    setShowFeedback(false);
    setSelected(null);
    setForceUnansweredJump(false);
    setShowResult(false); // <-- reforço visual no retorno
  }
  }, [forceUnansweredJump]);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleOptionClick = (option) => {
    if (!showFeedback) {
      setSelected(option);
      setShowFeedback(true);
      const updated = [...answers];
      updated[current] = option;
      setAnswers(updated);
      if (option === quizData[current].answer) {
        setScore((prev) => prev + 1);
      }
    }
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelected(null);
    if (current + 1 < quizData.length) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
      const hasUnanswered = answers.some(ans => ans === undefined);
      setFinished(!hasUnanswered);
  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== quizTitle);
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setAnswers(new Array(quizData.length).fill(undefined));
    setSelected(null);
    setShowFeedback(false);
    setShowResult(false);
    setScore(0);
  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== quizTitle);
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
    setQuizData(shuffleArray(quizData.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }))));
  };

  const downloadGabarito = () => {
    const text = quizData.map((q, idx) => {
      const userAnswer = answers[idx];
      if (userAnswer === undefined) return `Pergunta ${idx + 1}: ${q.question}\nNão respondida\n`;
      const correct = userAnswer === q.answer;
      return `Pergunta ${idx + 1}: ${q.question}\nResposta do usuário: ${userAnswer} ${correct ? '(Correta)' : `(Errada - Correta: ${q.answer})`}\nExplicação: ${q.explanation || 'Sem explicação disponível.'}\n`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gabarito.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveAsIncomplete = () => {
  if (quizData.length === 0) return;
  const allAnswered = answers.length === quizData.length && answers.every(a => a !== undefined);
  if (allAnswered) return;

  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== quizTitle);
  updated.unshift({
    title: quizTitle,
    current,
    answers,
    score,
    quizData,
    date: new Date().toISOString()
  });
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated.slice(0, 10)));
};


  const getFeedbackMessage = () => {
    const totalAnswered = answers.filter(ans => ans !== undefined).length;
    const ratio = score / totalAnswered;
    if (ratio < 0.4) return "💡 Você precisa estudar mais!";
    if (ratio < 0.75) return "🔍 Está indo bem, continue praticando!";
    return "🎉 Você está arrasando! Parabéns!";
  };

  const getCompletedQuizzes = () => JSON.parse(localStorage.getItem("completedQuizzes") || "[]");
  const getIncompleteQuizzes = () => JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const removeCompletedQuiz = (title) => {
    const updated = getCompletedQuizzes().filter(q => q.title !== title);
    localStorage.setItem("completedQuizzes", JSON.stringify(updated));
  };
  const removeIncompleteQuiz = (title) => {
    const updated = getIncompleteQuizzes().filter(q => q.title !== title);
    localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
  };

    const clearCurrentQuizProgress = () => {
    const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
    const updated = saved.filter(q => q.title !== quizTitle);
    localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
  };

  const renderUserArea = () => {
    const completed = getCompletedQuizzes();
    const incomplete = getIncompleteQuizzes();

    return (
      <div className="space-y-6">
      <div className="flex items-center justify-between h-16">
        <button
          onClick={() => setShowUserArea(false)}
          className="text-blue-400 hover:underline flex items-center h-full"
        >
          Voltar
        </button>
        <h2 className="text-2xl font-bold text-center mx-auto">Minha Área</h2>
        <div className="w-[75px]" />
      </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Quizzes Concluídos ⭐</h3>
          {completed.length === 0 ? <p className="text-sm text-gray-400">Nenhum quiz concluído.</p> : (
            <ul className="space-y-2">
              {completed.map((quiz, idx) => (
                <li key={idx} className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <strong>{quiz.title}</strong> – ⭐ {quiz.score}/{quiz.total} – {new Date(quiz.date).toLocaleDateString()}
                  </div>
                  <button onClick={() => removeCompletedQuiz(quiz.title)} className="text-sm text-red-400 hover:underline mt-2 sm:mt-0">Excluir</button>
                </li>
              ))}
            </ul>
          )}
          {completed.length > 0 && (
            <button onClick={() => {
              localStorage.removeItem("completedQuizzes");
              setRefreshUserArea(prev => !prev); // força re-render
            }} className="mt-4 bg-red-700 px-4 py-2 rounded hover:bg-red-800 text-white">Limpar Concluídos</button>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Quizzes Inacabados 🕒</h3>
          {incomplete.length === 0 ? <p className="text-sm text-gray-400">Nenhum quiz em andamento.</p> : (
            <ul className="space-y-2">
              {incomplete.map((quiz, idx) => (
                <li key={idx} className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <strong>{quiz.title}</strong> –{quiz.answers.filter(a => a !== undefined).length}/{quiz.quizData.length} respondidas
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button onClick={async () => {
                      setQuizData(quiz.quizData);
                      setQuizTitle(quiz.title);
                      setCurrent(quiz.current);
                      setAnswers(
                        quiz.answers.map(ans => (ans === undefined || ans === '' || ans === null) ? undefined : ans)
                      );
                      setScore(quiz.score);
                      setShowResult(false);
                      setSelected(null);
                      setShowFeedback(false);
                      setShowUserArea(false);
                      setFinished(false); // <- AQUI
                    }} className="text-sm text-blue-400 hover:underline">Retomar</button>
                    <button onClick={() => removeIncompleteQuiz(quiz.title)} className="text-sm text-red-400 hover:underline">Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {incomplete.length > 0 && (
            <button onClick={() => {
              localStorage.removeItem("incompleteQuizzes");
              setRefreshUserArea(prev => !prev); // força re-render
            }} className="mt-4 bg-red-700 px-4 py-2 rounded hover:bg-red-800 text-white">Limpar Inacabados</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-slate-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 p-6 rounded-lg shadow-xl min-h-[90vh] flex flex-col justify-between">
                {showUserArea ? renderUserArea() : (
                    <>
        <div>
          <h1 className="text-3xl font-bold mb-4 text-center">Quiz Interativo</h1>

          {!quizData.length && (
  <div className="flex flex-col items-center gap-6 mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <input
        type="file"
        accept=".txt"
        onChange={handleFileUpload}
        className="block text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
      />
    </div>

    <div className="flex items-center justify-center gap-2 text-gray-400 text-center">
      <p>Faça upload de um arquivo .txt com perguntas ou selecione um quiz pronto.</p>
      <div className="relative group" ref={tooltipRef}>
      <span 
    className="cursor-pointer text-blue-400 font-bold material-symbols-outlined"
    onClick={() => {
      if (isTouchDevice) {
        setShowInfo(prev => !prev);
      }
    }}
    onMouseEnter={() => {
      if (!isTouchDevice) {
        setShowInfo(true);
      }
    }}
    onMouseLeave={() => {
      if (!isTouchDevice) {
        setShowInfo(false);
      }
    }}
  >
    info
  </span>
    <div
          className={`absolute left-1/2 -translate-x-1/2 mt-2 w-[320px] p-4 bg-slate-700 text-sm text-left text-white rounded shadow-lg z-10 transition-opacity duration-300
            ${showInfo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
        >
      <p className="font-semibold mb-2">Formato esperado das perguntas:</p>
      <pre className="whitespace-pre-wrap font-mono text-xs">
P: Qual elemento define um jogo?<br/>
A) Narrativa e gráficos<br/>
B) Controles e história<br/>
C) Interatividade, regras, objetivos<br/>
D) Apenas diversão<br/>
R: C<br/>
E: A resposta correta é C porque um jogo é definido por seus elementos estruturais: interatividade, regras, obstáculos e objetivos.
      </pre>
    </div>
  </div>
</div>

{!quizData.length && (
  <>
    <button onClick={() => setShowUserArea(true)} className="bg-blue-600 text-white px-4 py-2 rounded w-48">
      Minha Área
    </button>
    <select
      className="mb-6 p-2 rounded-lg bg-slate-700 text-white text-center"
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
    >
      <option value="">Selecione uma matéria</option>
      {Object.keys(categories).map((category) => (
        <option key={category} value={category}>{category}</option>
      ))}
    </select>
  </>
)}

{selectedCategory && (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {categories[selectedCategory].map((file, idx) => (
      <button
        key={idx}
        onClick={async () => {
          const res = await fetch(`/quizzes/${file}`);
          const text = await res.text();
          const parsed = shuffleArray(parseQuiz(text));
          setQuizData(parsed);
          setQuizTitle(file.split('/').pop().replace(".txt", "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()));
          setCurrent(0);
          setAnswers(new Array(parsed.length).fill(undefined));
          setSelected(null);
          setShowFeedback(false);
          setShowResult(false);
          setScore(0);
          const title = file.split('/').pop().replace(".txt", "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          setQuizTitle(title);

          setTimeout(() => {
            const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
            const updated = saved.filter(q => q.title !== title);
            localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));
          }, 0);

        }}
        className="bg-slate-700 text-white p-4 rounded hover:bg-slate-600 text-center shadow-md"
      >
        <strong>
          {file
            .split('/').pop()
            .replace(".txt", "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </strong>
        <br />
        <span className="text-sm text-slate-300">
          {quizLengths[file]
            ? `${quizLengths[file]} questõe${quizLengths[file] > 1 ? "s" : ""}`
            : "Carregando..."}
        </span>
      </button>
    ))}
  </div>
  )}
  </div>
)}

          {quizData.length > 0 && !showResult && (
            <>
              <button
              onClick={() => {
                saveAsIncomplete(); // salva se não estiver completo

                setQuizData([]);
                setAnswers([]);
                setSelected(null);
                setShowFeedback(false);
                setShowResult(false);
                setCurrent(0);
                setFinished(false);
              }}
              className="mb-6 bg-blue-700 px-4 py-2 rounded hover:bg-blue-800"
            >
              Começar novo quiz
            </button>
            <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Pergunta {current + 1} de {quizData.length}{" "}
              <span className="text-blue-400">(Quiz {quizTitle})</span>
            </h2>
              <p className="text-lg font-medium break-words whitespace-pre-wrap">{quizData[current].question}</p>

              <div className="flex flex-col gap-3">
                {quizData[current].options.map((option, idx) => {
                  const letter = option.charAt(0);
                  const textOnly = option.substring(2).trim();
                  const isCorrect = quizData[current].answer === letter;
                  const isSelected = selected === letter;

                  const ringColor = isSelected
                    ? selected === quizData[current].answer
                      ? 'ring-green-500'
                      : 'ring-red-500'
                    : '';

                  const displayText = showFeedback ? `${letter}) ${textOnly}` : textOnly;


                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(letter)}
                      className={`p-3 rounded-md text-white text-left font-semibold transition-colors duration-200 break-words whitespace-pre-wrap border bg-slate-700 ${isSelected ? `ring-2 ${ringColor}` : ''}`}
                      disabled={showFeedback}
                    >
                      {displayText}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className="mt-4 space-y-2">
                  {selected === quizData[current].answer ? (
                    <p className="text-green-400 font-semibold">Resposta correta!</p>
                  ) : (
                    <p className="text-red-400 font-semibold">Você errou. A resposta correta é: {quizData[current].answer}</p>
                  )}
                  <p className="text-sm text-slate-300 italic whitespace-pre-wrap">{quizData[current].explanation || 'Sem explicação disponível.'}</p>
                </div>
              )}
            </div>
            </>
          )}
          

          {showResult && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold">Resultado</h2>
              <p className="text-lg">Pontuação: {score} de {answers.filter(ans => ans !== undefined).length} respondidas</p>
              <p className="text-xl font-semibold mt-2">{getFeedbackMessage()}</p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    saveAsIncomplete(); // salva se não estiver completo

                    setQuizData([]);
                    setAnswers([]);
                    setSelected(null);
                    setShowFeedback(false);
                    setShowResult(false);
                    setCurrent(0);
                    setFinished(false);
                  }}
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Começar novo quiz
                </button>
              </div>
              <ul className="list-disc text-left ml-5">
                {quizData.map((q, idx) => {
                  const userAnswer = answers[idx];
                  const isCorrect = userAnswer === q.answer;
                  const isUnanswered = userAnswer === undefined;
                  return (
                    <li key={idx} className="mb-2">
                      <p className="font-medium break-words whitespace-pre-wrap">{q.question}</p>
                      <p className={`text-sm ${isUnanswered ? 'text-orange-400' : isCorrect ? 'text-green-400' : 'text-red-400'}`}>Sua resposta: {userAnswer || 'Não respondida'} {!isUnanswered && (isCorrect ? '(Correta)' : `(Errada - Correta: ${q.answer})`)}</p>
                      {!isUnanswered && (
                        <p className="text-sm text-slate-300 italic whitespace-pre-wrap">{q.explanation || 'Sem explicação disponível.'}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {(quizData.length > 0 && !showResult && showFeedback) && (
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-between">
            {current + 1 < quizData.length ? (
              <>
                <button
                  onClick={nextQuestion}
                  className="w-full sm:w-auto bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
                >
                  Próxima pergunta
                </button>
                <button
                onClick={() => {
                  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
                  const updated = saved.filter(q => q.title !== quizTitle);
                  updated.unshift({
                    title: quizTitle,
                    current,
                    answers,
                    score,
                    quizData,
                    date: new Date().toISOString()
                  });
                  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated.slice(0, 10)));

                  setFinished(false); // ← força a lógica de 'quiz incompleto'
                  setShowResult(true);
                }}
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Finalizar Quiz Agora
                </button>
              </>
            ) : (
              <div className="w-full flex justify-center">
              <button
                onClick={() => {
                  setShowResult(true);
                  setFinished(true);

                  const saved = JSON.parse(localStorage.getItem("completedQuizzes") || "[]");
                  saved.unshift({
                    title: quizTitle,
                    score,
                    total: quizData.length,
                    date: new Date().toISOString(),
                    answers,
                    quizData
                  });
                  localStorage.setItem("completedQuizzes", JSON.stringify(saved.slice(0, 20)));

                  clearCurrentQuizProgress();
                }}
                className="w-full sm:w-3/3 bg-green-700 text-white px-4 py-3 rounded text-lg font-semibold hover:bg-green-800"
              >
                Finalizar
              </button>
              </div>
            )}
          </div>
        )}

        {showResult && (
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            {finished ? (
              <button onClick={resetQuiz} className="w-full sm:w-auto bg-slate-700 text-white p-2 rounded hover:bg-slate-600">Reiniciar Quiz</button>
            ) : (
              <button
              onClick={() => {
                const firstUnanswered = answers.findIndex(ans => ans === undefined);
                if (firstUnanswered !== -1) {
                  setForceUnansweredJump(true);
                  setCurrent(firstUnanswered);
                  setShowResult(false);
                  setShowFeedback(false);
                  setSelected(null);
                  setFinished(false);
                }
              }}
                className="w-full sm:w-auto bg-blue-700 text-white p-2 rounded hover:bg-blue-800"
              >
                Voltar e Responder Faltantes
              </button>
            )}
            <button onClick={downloadGabarito} className="w-full sm:w-auto bg-green-700 text-white p-2 rounded hover:bg-green-800">Baixar Gabarito</button>
          </div>
        )}
        {(!quizData.length || showResult) && (
          <footer className="mt-8 text-center text-sm text-gray-500">
            Idealizado por <span className="text-white font-medium">Kauan B.</span>
          </footer>
        )}
          </>
)}
      </div>
    </div>
  );
}