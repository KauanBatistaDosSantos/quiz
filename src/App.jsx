import React, { useState } from 'react';

export default function QuizInterativo() {
  const [quizData, setQuizData] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseQuiz(text);
      setQuizData(parsed);
      setCurrent(0);
      setAnswers([]);
      setSelected(null);
      setShowFeedback(false);
      setShowResult(false);
    };
    reader.readAsText(file);
  };

  const parseQuiz = (text) => {
    const blocks = text.split(/\n(?=P: )/);
    return blocks.map((block) => {
      const lines = block.trim().split('\n');
      const question = lines[0].replace('P: ', '');
      const options = lines.slice(1, 5).map((line) => line.trim());
      const answer = lines[5]?.replace('R: ', '').trim();
      const explanation = lines[6]?.replace('E: ', '').trim();
      return { question, options, answer, explanation };
    });
  };

  const handleOptionClick = (option) => {
    setSelected(option);
    setShowFeedback(true);
    const updated = [...answers];
    updated[current] = option;
    setAnswers(updated);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelected(null);
    if (current + 1 < quizData.length) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setShowFeedback(false);
    setShowResult(false);
  };

  const downloadGabarito = () => {
    const text = quizData.map((q, idx) => {
      const userAnswer = answers[idx];
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

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quiz Interativo</h1>

      <input type="file" accept=".txt" onChange={handleFileUpload} className="mb-4" />

      {!quizData.length && <p className="text-gray-500">Faça upload de um arquivo .txt com perguntas.</p>}

      {quizData.length > 0 && !showResult && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pergunta {current + 1} de {quizData.length}</h2>
          <p className="text-lg font-medium">{quizData[current].question}</p>
          <div className="grid gap-2">
            {quizData[current].options.map((option, idx) => {
              const isSelected = selected === option.charAt(0);
              const isCorrect = quizData[current].answer === option.charAt(0);
              const base = "p-2 rounded text-white";
              let color = "bg-blue-500 hover:bg-blue-600";
              if (showFeedback) {
                if (isSelected && isCorrect) color = "bg-green-600";
                else if (isSelected && !isCorrect) color = "bg-red-600";
                else color = "bg-gray-400";
              }
              return (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleOptionClick(option.charAt(0))}
                  className={`${base} ${color}`}
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
                <p className="text-green-700">Resposta correta!</p>
              ) : (
                <p className="text-red-700">Você errou. A resposta correta é: {quizData[current].answer}</p>
              )}
              <p className="text-sm text-gray-800 italic">{quizData[current].explanation || 'Sem explicação disponível.'}</p>
              <button onClick={nextQuestion} className="mt-3 bg-gray-700 text-white p-2 rounded hover:bg-gray-800">
                Próxima pergunta
              </button>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Resultado</h2>
          <ul className="list-disc ml-5">
            {quizData.map((q, idx) => (
              <li key={idx} className="mb-2">
                <p className="font-medium">{q.question}</p>
                <p className={`text-sm ${answers[idx] === q.answer ? 'text-green-600' : 'text-red-600'}`}>
                  Sua resposta: {answers[idx]} {answers[idx] === q.answer ? '(Correta)' : `(Errada - Correta: ${q.answer})`}
                </p>
                <p className="text-sm text-gray-700 italic">{q.explanation || 'Sem explicação disponível.'}</p>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button onClick={resetQuiz} className="bg-gray-700 text-white p-2 rounded hover:bg-gray-800">Reiniciar Quiz</button>
            <button onClick={downloadGabarito} className="bg-green-700 text-white p-2 rounded hover:bg-green-800">Baixar Gabarito</button>
          </div>
        </div>
      )}
    </div>
  );
}
