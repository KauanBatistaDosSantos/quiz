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
  const [multiAnswers, setMultiAnswers] = useState({});
  const [userMatches, setUserMatches] = useState({});
  const [selectedLetter, setSelectedLetter] = useState(null);


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
const blocks = text.split(/\n(?=P(?:MA|SC|MP)?: )/);
  return blocks.map((block) => {
    const lines = block.trim().split('\n');
    const firstLine = lines[0];
    let type = null;
    let questionLines = [];

    if (firstLine.startsWith("PMA:")) {
      type = "multi-assert";
      questionLines.push(firstLine.replace("PMA:", "").trim());
    } else if (firstLine.startsWith("PSC:") || firstLine.startsWith("P:")) {
      type = "single-choice";
      questionLines.push(firstLine.replace(/^(PSC|P):/, "").trim());
    } else if (firstLine.startsWith("PMP:")) {
      type = "match-pairs";
      questionLines.push(firstLine.replace("PMP:", "").trim());
    } else {
      return null;
    }

    let i = 1;
    while (i < lines.length && !/^[A-Z]\)|^\d+\)|^R[A-Z]:|^R:/.test(lines[i])) {
      questionLines.push(lines[i]); // preserva espaços
      i++;
    }

    const linesWithoutHeader = lines.slice(i);
    const question = questionLines.join('\n').trim();

    if (type === "multi-assert") {
      const assertions = [];
      const answers = {};
      const explanations = {};

      for (let i = 0; i < linesWithoutHeader.length; i++) {
        const line = linesWithoutHeader[i];
        if (/^[A-Z]\)/.test(line)) {
          const id = line[0];
          const text = line.slice(2).trim();
          if (text) {
            assertions.push({ id, text });
          }
        }
        if (/^R[A-Z]:/.test(line)) {
          const id = line[1];
          const value = line.split(':')[1]?.trim().toLowerCase();
          if (value === 'true' || value === 'false') {
            answers[id] = value === 'true';
          }
        }
        if (/^E[A-Z]:/.test(line)) {
          const id = line[1];
          const explanation = line.split(':')[1]?.trim();
          if (explanation) {
            explanations[id] = explanation;
          }
        }
      }

      return {
        type,
        question,
        assertions,
        correctAnswers: answers,
        explanations,
      };
    }

if (type === "match-pairs") {
  const columnA = [];
  const columnB = [];
  const correctPairs = {};
  const explanations = {};

  for (const line of linesWithoutHeader) {
    if (/^[A-Z]\)/.test(line)) {
      const id = line[0];
      const text = line.slice(2).trim();
      columnA.push({ id, text });
    } else if (/^\d+\)/.test(line)) {
      const match = line.match(/^(\d+)\)\s*(.*)/);
      if (match) {
        const num = match[1];
        const text = match[2];
        columnB.push({ id: num, text });
      }
    } else if (/^R[A-Z]:/.test(line)) {
      const id = line[1];
      const matchId = line.split(":")[1].trim();
      correctPairs[id] = matchId;
    } else if (/^E[A-Z]:/.test(line)) {
      const id = line[1];
      explanations[id] = line.replace(/^E[A-Z]:/, '').trim();
    }
  }

  return {
    type,
    question,
    columnA,
    columnB,
    correctPairs,
    explanations,
  };
}

    if (type === "single-choice") {
      const options = shuffleArray(linesWithoutHeader.filter(line => /^[A-Z]\)/.test(line)));
      const answerLine = linesWithoutHeader.find(line => line.startsWith("R:"));
      const explanationLines = linesWithoutHeader.filter(line => line.startsWith("E:"));
      const explanation = explanationLines.map(l => l.replace(/^E:\s?/, '')).join("\n").trim();
      const answer = answerLine?.replace("R:", "").trim();

      return {
        type,
        question,
        options,
        answer,
        explanation,
      };
    }

    return null;
  }).filter(Boolean);
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
  const currentQ = quizData[current];
  if (currentQ?.type === 'multi-assert') {
    const allRespondidas = currentQ.assertions.every(
      (a) => multiAnswers[a.id] !== undefined
    );
    if (allRespondidas) {
      setShowFeedback(true);
    }
  }
}, [multiAnswers, current]);

useEffect(() => {
  const currentQ = quizData[current];
  if (!currentQ || currentQ.type !== 'match-pairs') return;

  const total = Object.keys(currentQ.correctPairs).length;
  const preenchidas = Object.keys(userMatches).length;

  if (preenchidas === total) {
    setShowFeedback(true);
  }
}, [userMatches, current, quizData]);


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
      updated[current] = option; // <-- Corrigido aqui!
      setAnswers(updated);

      if (option === quizData[current].answer) {
        setScore((prev) => prev + 1);
      }
    }
  };

const nextQuestion = () => {
  setShowFeedback(false);
  setSelected(null);

  const currentQ = quizData[current];

if (currentQ.type === 'multi-assert') {
  const total = currentQ.assertions.length;
  const allRespondidas = currentQ.assertions.every(
    (a) => multiAnswers[a.id] !== undefined
  );

  if (!allRespondidas) {
    return alert('Responda todas as afirmações antes de continuar.');
  }

  const correct = currentQ.assertions.filter(assert => {
    return multiAnswers[assert.id] === currentQ.correctAnswers[assert.id];
  }).length;

  // Só marca ponto se ainda não tinha respondido antes
  if (answers[current] === undefined && correct / total >= 0.5) {
    setScore((prev) => prev + 1);
  }

  const updated = [...answers];
  updated[current] = multiAnswers;
  setAnswers(updated);
  setMultiAnswers({});
}

if (currentQ.type === 'match-pairs') {
  const total = Object.keys(currentQ.correctPairs).length;
  const userTotal = Object.keys(userMatches).length;

  // 🟢 Já mostrou feedback, então pode avançar diretamente
  if (showFeedback) {
    setUserMatches({});
    setSelectedLetter(null);
    setShowFeedback(false);
    setCurrent(prev => prev + 1);
    return;
  }

  // ⚠️ Ainda não respondeu tudo
  if (userTotal !== total) {
    return alert('Associe todos os itens antes de continuar.');
  }

  // ✅ Calcula quantos pares corretos
  const correct = Object.entries(currentQ.correctPairs).filter(
    ([letra, numero]) => userMatches[letra] === numero
  ).length;

  // ✅ Marca ponto apenas se for a primeira vez
  if (answers[current] === undefined && correct === total) {
    setScore(prev => prev + 1);
  }

  const updated = [...answers];
  updated[current] = { ...userMatches };
  setAnswers(updated);

  setShowFeedback(true); // Apenas exibe, não bloqueia mais
  return;
}


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
  setMultiAnswers({}); // limpa respostas PMA
  setSelected(null);
  setShowFeedback(false);
  setShowResult(false);
  setScore(0);
  setFinished(false); // garante que o botão volte ao modo certo

  // Se estiver usando associação (match-pairs), limpe também:
  setMatchAnswer?.({}); // adicione isso se estiver usando match-pairs

  // Limpa localStorage
  const saved = JSON.parse(localStorage.getItem("incompleteQuizzes") || "[]");
  const updated = saved.filter(q => q.title !== quizTitle);
  localStorage.setItem("incompleteQuizzes", JSON.stringify(updated));

  // Reembaralha as perguntas e opções
  setQuizData(shuffleArray(
    quizData.map(q => ({
      ...q,
      options: shuffleArray(q.options),
      correctPairs: q.correctPairs || {}, // garante que PMA/PMP estejam limpos
    }))
  ));
};


  const downloadGabarito = () => {
const text = quizData.map((q, idx) => {
  const userAnswer = answers[idx];

  if (userAnswer === undefined) {
    return `Pergunta ${idx + 1}: ${q.question}\nNão respondida\n`;
  }

  // MULTI-ASSERT
  if (q.type === "multi-assert") {
    const assertions = q.assertions;
    const correctAnswers = q.correctAnswers;
    const explanations = q.explanations || {};

    const total = assertions.length;
    const correctCount = assertions.filter(
      (a) => userAnswer[a.id] === correctAnswers[a.id]
    ).length;

    const acertoTotal = correctCount === total;
    const erroTotal = correctCount === 0;

    let resultado =
      acertoTotal
        ? "Você acertou todas as afirmações."
        : erroTotal
        ? "Você errou todas as afirmações."
        : `Você acertou ${correctCount} e errou ${total - correctCount} afirmaç${total - correctCount === 1 ? 'ão' : 'ões'}.`;

    const detalhes = assertions.map((a) => {
      const u = userAnswer[a.id];
      const c = correctAnswers[a.id];
      const certo = u === c;
      const explicacao = explanations[a.id] || 'Sem explicação disponível.';

      return `${a.id}) Você respondeu: ${u === true ? 'Verdadeiro' : u === false ? 'Falso' : 'Não respondida'} ${certo ? '(Correta)' : `(Errada - Correta: ${c ? 'Verdadeiro' : 'Falso'})`}\n→ ${explicacao}`;
    }).join('\n\n');

    return `Pergunta ${idx + 1}: ${q.question}\n${resultado}\n\n${detalhes}\n`;
  }

  // SINGLE-CHOICE
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
  saveAsIncomplete(); // ok se quiser manter

  setQuizData([]);           // limpa perguntas
  setAnswers([]);            // limpa respostas normais
  setMultiAnswers({});       // limpa PMA
  setSelected(null);         // limpa seleção de alternativas
  setShowFeedback(false);    // tira feedback da tela
  setShowResult(false);      // esconde resultado
  setCurrent(0);             // volta à primeira pergunta
  setFinished(false);        // reinicia status
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
                {quizData[current].type === 'multi-assert' ? (
  <div className="space-y-4">
    {quizData[current].assertions.map((assert, idx) => {
      const selected = multiAnswers[assert.id];
      const isCorrect = quizData[current].correctAnswers[assert.id] === selected;
      const showColor = selected !== undefined && showFeedback;

      return (
        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (showFeedback) return;
                setMultiAnswers(prev => ({ ...prev, [assert.id]: true }));
              }}
              className={`px-4 py-2 rounded ${
                showColor
                  ? selected === true && isCorrect ? 'bg-green-500 text-white' :
                    selected === true && !isCorrect ? 'bg-red-500 text-white' : 'bg-green-200 text-black'
                  : 'bg-green-200 text-black'
              }`}
            >
              Verdadeiro
            </button>
            <button
              onClick={() => {
                if (showFeedback) return;
                setMultiAnswers(prev => ({ ...prev, [assert.id]: false }));
              }}
              className={`px-4 py-2 rounded ${
                showColor
                  ? selected === false && isCorrect ? 'bg-green-500 text-white' :
                    selected === false && !isCorrect ? 'bg-red-500 text-white' : 'bg-red-200 text-black'
                  : 'bg-red-200 text-black'
              }`}
            >
              Falso
            </button>
          </div>
          <div className="bg-gray-500 text-white p-2 rounded-lg w-full">{assert.text}</div>
        </div>
      );
    })}
  </div>

  ) : quizData[current].type === 'match-pairs' ? (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {quizData[current].columnA.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (showFeedback) return;
              setSelectedLetter(item.id);
            }}
            className={`w-full p-2 rounded text-left ${selectedLetter === item.id ? 'bg-green-400' : 'bg-slate-600'}`}
          >
{item.id}) {item.text}
{userMatches[item.id] && (
  <span className="ml-2 text-sm text-slate-300">
    → {userMatches[item.id]}
  </span>
)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
{quizData[current].columnB.map((item) => {
  const isUsed = Object.values(userMatches).includes(item.id); // <--- ESSA LINHA

  return (
          <button
            key={item.id}
            onClick={() => {
              if (showFeedback || !selectedLetter) return;
              setUserMatches(prev => ({
                ...prev,
                [selectedLetter]: item.id
              }));
              setSelectedLetter(null);
            }}
        className={`w-full p-2 rounded text-left ${
          !selectedLetter
            ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
            : isUsed ? 'bg-green-400 text-black' : 'bg-slate-700 hover:bg-slate-600'
        }`}
          >
            {item.id}) {item.text}
          </button>
  );
})}
      </div>
    </div>
  ) : (
                quizData[current].options.map((option, idx) => {
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
                })
                )}
              </div>

{showFeedback && quizData[current].type === 'single-choice' && (
  <div className="mt-4 space-y-2">
    {selected === quizData[current].answer ? (
      <p className="text-green-400 font-semibold">Resposta correta!</p>
    ) : (
      <p className="text-red-400 font-semibold">Você errou. A resposta correta é: {quizData[current].answer}</p>
    )}
    <p className="text-sm text-slate-300 italic whitespace-pre-wrap">{quizData[current].explanation || 'Sem explicação disponível.'}</p>
  </div>
)}


{quizData[current].type === 'multi-assert' && showFeedback && (
  <div className="mt-4 space-y-4">
{(() => {
  const total = quizData[current].assertions.length;
  const acertos = quizData[current].assertions.filter(
    (a) => multiAnswers[a.id] === quizData[current].correctAnswers[a.id]
  ).length;
  const erros = total - acertos;

  if (acertos === total) {
    return <p className="font-semibold text-green-400">Você acertou todas as afirmações!</p>;
  } else if (erros === total) {
    return <p className="font-semibold text-red-400">Você errou todas as afirmações.</p>;
  } else {
    return (
      <p className="font-semibold text-white">
        Você acertou {acertos} e errou {erros} afirmaç{erros === 1 ? "ão" : "ões"}:
      </p>
    );
  }
})()}


    {quizData[current].assertions.map((assert) => {
      const user = multiAnswers[assert.id];
      const correct = quizData[current].correctAnswers[assert.id];
      const acertou = user === correct;
      const explicacao = quizData[current].explanations?.[assert.id] || 'Sem explicação disponível.';

      return (
        <div key={assert.id} className="space-y-1 text-sm">
          <p className={`${acertou ? 'text-green-400' : 'text-red-400'}`}>
            <strong>{assert.id})</strong> Você respondeu: {user === true ? 'Verdadeiro' : user === false ? 'Falso' : 'Não respondida'}
            {user !== undefined && (
              acertou ? ' (Correta)' : ` (Errada - Correta: ${correct ? 'Verdadeiro' : 'Falso'})`
            )}
          </p>
          <p className="text-slate-300 italic">→ {explicacao}</p>
        </div>
      );
    })}
  </div>
)}

{quizData[current].type === 'match-pairs' && showFeedback && (
  <div className="mt-4 space-y-4">
    {(() => {
      const total = Object.keys(quizData[current].correctPairs).length;
      const acertos = Object.entries(quizData[current].correctPairs).filter(
        ([letra, correta]) => userMatches[letra] === correta
      ).length;
      const erros = total - acertos;

      if (acertos === total) {
        return <p className="text-green-400 font-semibold">Você acertou todas as associações!</p>;
      } else if (erros === total) {
        return <p className="text-red-400 font-semibold">Você errou todas as associações.</p>;
      } else {
        return <p className="text-white font-semibold">Você acertou {acertos} e errou {erros} associação{erros !== 1 ? 'es' : ''}.</p>;
      }
    })()}

    {quizData[current].columnA.map(({ id, text }) => {
      const user = userMatches[id];
      const correct = quizData[current].correctPairs[id];
      const acertou = user === correct;
      const explicacao = quizData[current].explanations?.[id] || "Sem explicação disponível.";

      return (
        <div key={id} className="space-y-1 text-sm">
          <p className={`${acertou ? 'text-green-400' : 'text-red-400'}`}>
            <strong>{id})</strong> Você respondeu: {user || '—'} {acertou ? '(Correta)' : `(Errada - Correta: ${correct})`}
          </p>
          <p className="text-slate-300 italic">→ {explicacao}</p>
        </div>
      );
    })}
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
  saveAsIncomplete(); // ok se quiser manter

  setQuizData([]);           // limpa perguntas
  setAnswers([]);            // limpa respostas normais
  setMultiAnswers({});       // limpa PMA
  setSelected(null);         // limpa seleção de alternativas
  setShowFeedback(false);    // tira feedback da tela
  setShowResult(false);      // esconde resultado
  setCurrent(0);             // volta à primeira pergunta
  setFinished(false);        // reinicia status
}}
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Começar novo quiz
                </button>
              </div>
<ul className="list-disc text-left ml-5">
  {quizData.map((q, idx) => {
    const userAnswer = answers[idx];

    // caso especial: multi-assert
    if (q.type === 'multi-assert') {
      const assertions = q.assertions;
      const correctAnswers = q.correctAnswers;
const isUnanswered = !userAnswer || Object.keys(userAnswer).length < assertions.length;

      return (
        <li key={idx} className="mb-4">
          <p className="font-medium break-words whitespace-pre-wrap mb-2">{q.question}</p>
          {isUnanswered ? (
            <p className="text-orange-400">Não respondida</p>
          ) : (
            <ul className="ml-4 space-y-1">
              {assertions.map((a) => {
                const user = userAnswer?.[a.id];
                const correct = correctAnswers[a.id];
                const acertou = user === correct;

                return (
                  <li key={a.id} className={`text-sm ${user === undefined ? 'text-orange-400' : acertou ? 'text-green-400' : 'text-red-400'}`}>
                    {a.id} {a.text} — Sua resposta: {user === undefined ? 'Não respondida' : user ? 'Verdadeiro' : 'Falso'} {user !== undefined && (acertou ? '(Correta)' : `(Errada - Correta: ${correct ? 'Verdadeiro' : 'Falso'})`)}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    // padrão: single-choice
let isCorrect = false;
let isUnanswered = false;

if (userAnswer === undefined) {
  isUnanswered = true;
} else if (typeof userAnswer === 'object' && userAnswer !== null && Object.keys(userAnswer).length === 0) {
  isUnanswered = true; // Objeto vazio
}

if (q.type === "multi-assert" && Array.isArray(q.answer)) {
  if (!isUnanswered) {
    const total = q.answer.length;
    const correctCount = q.answer.filter((a, i) => userAnswer[i] === a).length;
    const ratio = correctCount / total;
    isCorrect = ratio >= 0.5;
  }
  } else if (q.type === "match-pairs") {
  if (!isUnanswered) {
    const correctPairs = q.answer;
    const total = Object.keys(correctPairs).length;
    const correctCount = Object.entries(correctPairs).filter(
      ([key, val]) => userAnswer?.[key] === val
    ).length;
    isCorrect = correctCount === total;
  }
} else {
  isCorrect = userAnswer === q.answer;
}

    return (
      <li key={idx} className="mb-4">
        <p className="font-medium break-words whitespace-pre-wrap mb-1">{q.question}</p>
<p className={`text-sm ${isUnanswered ? 'text-orange-400' : isCorrect ? 'text-green-400' : 'text-red-400'}`}>
  Sua resposta:{" "}
  {(() => {
    if (isUnanswered) return "Não respondida";
    if (Array.isArray(userAnswer)) {
      return userAnswer
        .map((v, i) => `${String.fromCharCode(65 + i)}) ${v ? "Verdadeiro" : "Falso"}`)
        .join(" | ");
    }
if (typeof userAnswer === "string") {
  return `${userAnswer}${isCorrect ? " (Correta)" : ""}`;
}
if (typeof userAnswer === "object" && userAnswer !== null) {
  if (userAnswer.option) {
    return userAnswer.option;
  } else {
    // Provavelmente é uma questão PMP (match-pairs)
    const entries = Object.entries(userAnswer);
    if (entries.length === 0) return "Não respondida";
    
    const correctPairs = Object.entries(q.answer); // resposta correta

    return entries.map(([letra, numero]) => {
      const correto = correctPairs.find(([l, n]) => l === letra && n === numero);
      const isCorreto = !!correto;
      return `${letra}) → ${numero} (${isCorreto ? "Correto" : `Incorreto — certo: ${q.answer[letra]}`})`;
    }).join(" | ");
  }
}

    return "Formato desconhecido";
  })()}

  {!isUnanswered && !isCorrect && (
    <>
      {" "} (Correta:{" "}
      {(() => {
        if (Array.isArray(q.answer)) {
          return q.answer
            .map((v, i) => `${String.fromCharCode(65 + i)}) ${v ? "Verdadeiro" : "Falso"}`)
            .join(" | ");
        }
        if (typeof q.answer === "string") return q.answer;
        if (typeof q.answer === "object" && q.answer !== null) {
          return q.answer.option || JSON.stringify(q.answer);
        }
        return "Formato desconhecido";
      })()}
      )
    </>
  )}
</p>


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
  let finalAnswers = [...answers];

  if (quizData[current]?.type === 'multi-assert' && answers[current] === undefined) {
    finalAnswers[current] = multiAnswers;
    if (quizData[current]?.type === 'multi-assert' && answers[current] === undefined) {
  finalAnswers[current] = multiAnswers;
  setAnswers(finalAnswers);

  // calcula se merece o ponto
  const total = quizData[current].assertions.length;
  const correct = quizData[current].assertions.filter(
    a => multiAnswers[a.id] === quizData[current].correctAnswers[a.id]
  ).length;

  if (correct / total >= 0.5) {
    setScore(prev => prev + 1);
  }
}
    setAnswers(finalAnswers);
  }

  setTimeout(() => {
    setShowResult(true);
    setFinished(true);

    const saved = JSON.parse(localStorage.getItem("completedQuizzes") || "[]");
    saved.unshift({
      title: quizTitle,
      score,
      total: quizData.length,
      date: new Date().toISOString(),
      answers: finalAnswers,
      quizData
    });
    localStorage.setItem("completedQuizzes", JSON.stringify(saved.slice(0, 20)));

    clearCurrentQuizProgress();
  }, 0);
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

