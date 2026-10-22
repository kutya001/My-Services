import { useState } from 'react';
import { fill, whatsappLink } from '../shared/site';

/* Тест «Насколько бизнес управляется цифрами»: 5 вопросов, 0–2 балла за ответ. */
export default function Quiz({ t, onDiscuss }) {
  const total = t.questions.length;
  const max = total * 2;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const done = step >= total;

  const score = answers.reduce((s, a) => s + (2 - a), 0);
  const result = [...t.results].reverse().find((r) => score >= r.min) || t.results[0];
  const message = fill(t.message, { score, max, title: result.title });

  const choose = (idx) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
    setTimeout(() => setStep((s) => s + 1), 220);
  };
  const restart = () => { setAnswers([]); setStep(0); };

  return (
    <div className="quiz max-w-2xl mx-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-md p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-3 text-xs text-slate-400">
        <span>{done ? fill(t.scoreLabel, { score, max }) : fill(t.progress, { n: step + 1, total })}</span>
        {!done && step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="text-blue-400 hover:text-blue-300 font-semibold">
            <i className="fa-solid fa-arrow-left mr-1" aria-hidden="true" />{t.back}
          </button>
        )}
      </div>
      <div className="quiz-track h-1.5 rounded-full mb-6 overflow-hidden" aria-hidden="true">
        <div className="quiz-fill h-full rounded-full" style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
      </div>

      {!done ? (
        <div key={step} className="quiz-step">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-5 text-balance">{t.questions[step].q}</h3>
          <div className="grid gap-3">
            {t.questions[step].a.map((a, i) => (
              <button
                key={a}
                type="button"
                onClick={() => choose(i)}
                className={`quiz-option text-left rounded-xl border px-4 py-3.5 text-sm sm:text-base transition-all ${answers[step] === i ? 'quiz-option-on' : 'border-slate-700 hover:border-blue-500/60 text-slate-300'}`}
              >
                <span className="quiz-letter mr-3 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                {a}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="quiz-step text-center" aria-live="polite">
          <div className="quiz-score mx-auto mb-4 w-24 h-24 rounded-full flex items-center justify-center" style={{ '--p': score / max }}>
            <span className="text-3xl font-extrabold text-white">{score}<span className="text-base text-slate-500">/{max}</span></span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{result.title}</h3>
          <p className="text-slate-400 max-w-lg mx-auto">{result.text}</p>
          <p className="text-sm text-slate-300 mt-4">
            <span className="text-slate-500">{t.recommend}</span> <b className="text-blue-400">{result.service}</b>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={() => onDiscuss(message)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              {t.cta}
            </button>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl border border-slate-600 hover:border-green-500 text-slate-300 hover:text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2"
            >
              <i className="fa-brands fa-whatsapp text-green-400" aria-hidden="true" />
              {t.waCta}
            </a>
          </div>
          <button type="button" onClick={restart} className="mt-5 text-sm text-slate-400 hover:text-blue-400">
            <i className="fa-solid fa-rotate-left mr-1.5" aria-hidden="true" />{t.restart}
          </button>
        </div>
      )}
    </div>
  );
}
