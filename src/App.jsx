import React, { useState, useEffect } from 'react';

export default function QuizInterativo() {
  const [quizData, setQuizData] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

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
      setCurrent(0);
      setAnswers(new Array(parsed.length).fill(undefined));
      setSelected(null);
      setShowFeedback(false);
      setShowResult(false);
      setScore(0);
      localStorage.removeItem("quizProgress");
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
      const explanationLine = lines.find(line => line.startsWith('E:'));
      const answer = answerLine?.replace('R:', '').trim();
      const explanation = explanationLine?.replace('E:', '').trim();
      return { question, options, answer, explanation };
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("quizProgress");
    if (saved) {
      const { current, answers, score, quizData } = JSON.parse(saved);
      setAnswers(answers.length === quizData.length ? answers : new Array(quizData.length).fill(undefined).map((_, i) => answers[i]));
      setScore(score);
      setQuizData(quizData);
      const firstUnanswered = answers.findIndex(ans => ans === undefined);
      setCurrent(firstUnanswered !== -1 ? firstUnanswered : current);

      if (firstUnanswered !== -1) {
        setCurrent(firstUnanswered);
        setShowResult(false);
      }
    }
  }, []);

  useEffect(() => {
    if (quizData.length > 0) {
      localStorage.setItem("quizProgress", JSON.stringify({
        current, answers, score, quizData
      }));
    }
  }, [current, answers, score, quizData]);

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
      localStorage.removeItem("quizProgress");
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setAnswers(new Array(quizData.length).fill(undefined));
    setSelected(null);
    setShowFeedback(false);
    setShowResult(false);
    setScore(0);
    localStorage.removeItem("quizProgress");
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

  const getFeedbackMessage = () => {
    const totalAnswered = answers.filter(ans => ans !== undefined).length;
    const ratio = score / totalAnswered;
    if (ratio < 0.4) return "💡 Você precisa estudar mais!";
    if (ratio < 0.75) return "🔍 Está indo bem, continue praticando!";
    return "🎉 Você está arrasando! Parabéns!";
  };

  return (
    <div className="min-h-screen w-screen bg-slate-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 p-6 rounded-lg shadow-xl min-h-[90vh] flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-4 text-center">Quiz Interativo</h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <input type="file" accept=".txt" onChange={handleFileUpload} className="block text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>

          {!quizData.length && <p className="text-gray-400 text-center">Faça upload de um arquivo .txt com perguntas.</p>}

          {quizData.length > 0 && !showResult && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pergunta {current + 1} de {quizData.length}</h2>
              <p className="text-lg font-medium break-words whitespace-pre-wrap">{quizData[current].question}</p>

              <div className="flex flex-col gap-3">
                {quizData[current].options.map((option, idx) => {
                  const letter = option.charAt(0);
                  const isCorrect = quizData[current].answer === letter;
                  const isSelected = selected === letter;

                  const ringColor = isSelected
                    ? selected === quizData[current].answer
                      ? 'ring-green-500'
                      : 'ring-red-500'
                    : '';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(letter)}
                      className={`p-3 rounded-md text-white text-left font-semibold transition-colors duration-200 break-words whitespace-pre-wrap border bg-slate-700 ${isSelected ? `ring-2 ${ringColor}` : ''}`}
                      disabled={showFeedback}
                    >
                      {option}
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
          )}

          {showResult && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold">Resultado</h2>
              <p className="text-lg">Pontuação: {score} de {answers.filter(ans => ans !== undefined).length} respondidas</p>
              <p className="text-xl font-semibold mt-2">{getFeedbackMessage()}</p>
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
                    const hasUnanswered = answers.some(ans => ans === undefined);
                    setShowResult(true);
                    setFinished(!hasUnanswered);
                    localStorage.removeItem("quizProgress");
                  }}
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Finalizar Quiz Agora
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const hasUnanswered = answers.some(ans => ans === undefined);
                  setShowResult(true);
                  setFinished(!hasUnanswered);
                  localStorage.removeItem("quizProgress");
                }}
                className="w-full sm:w-auto bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
              >
                Finalizar
              </button>
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
                  setCurrent(firstUnanswered);
                  setSelected(null);
                  setShowResult(false);
                  setShowFeedback(false);
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
      </div>
    </div>
  );
}
