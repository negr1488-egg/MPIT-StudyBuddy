import React from 'react';
import { ArrowRight, Bell, BrainCircuit, CheckCircle2, ChartColumnIncreasing, Users } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const featureCards = [
  {
    title: 'Собирает задания в одном месте',
    text: 'StudyBuddy убирает хаос из чатов, устных договоренностей и заметок — все задачи видны в одном потоке.',
    icon: CheckCircle2,
  },
  {
    title: 'Напоминает о дедлайнах',
    text: 'Сервис поднимает вверх задачи на сегодня, отмечает риски и не дает потеряться важным делам.',
    icon: Bell,
  },
  {
    title: 'Показывает прогресс',
    text: 'Ученик, учитель и родитель видят понятный прогресс, а не только список незакрытых дел.',
    icon: ChartColumnIncreasing,
  },
  {
    title: 'Объединяет три роли',
    text: 'У каждой роли свой слой интерфейса, но все смотрят на один общий учебный процесс.',
    icon: Users,
  },
];

const roleCards = [
  {
    title: 'Ученик',
    text: 'Видит задачи, сроки, прогресс и добавляет новые задания вручную или через умный ввод.',
  },
  {
    title: 'Учитель',
    text: 'Создает задания, отслеживает статусы и держит под рукой единый журнал действий.',
  },
  {
    title: 'Родитель',
    text: 'Получает только важные сигналы: просрочки, динамику и общую картину по ребенку.',
  },
];

const benefitCards = [
  'Понятные дедлайны и меньше пропусков.',
  'Контроль без хаоса и лишних переключений.',
  'Удобная коммуникация между ролями.',
  'Готовая база под AI-функции позже.',
];

const howItWorks = [
  { step: '1', title: 'Добавляешь задания', text: 'Через форму или AI-ввод из обычного текста, без ручной рутины.' },
  { step: '2', title: 'Получаешь напоминания', text: 'Сервис поднимает вверх ближайшие дедлайны и риски до просрочки.' },
  { step: '3', title: 'Видишь прогресс', text: 'Ученик, учитель и родитель смотрят на один процесс с разных сторон.' },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(37,99,235,0.82),rgba(124,58,237,0.78))] p-6 text-white shadow-[0_30px_90px_rgba(37,99,235,0.16)] md:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100">
              <BrainCircuit className="h-4 w-4" />
              StudyBuddy
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">edtech productivity</span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Умный помощник для школьных задач, прогресса и связи между учеником, учителем и родителем
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100/90 md:text-lg">
              StudyBuddy делает учебные задачи понятнее, помогает не забывать важные дела и показывает реальный прогресс каждому участнику процесса.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('/register')}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Начать
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Войти
              </button>
            </div>
          </div>

          <div className="grid gap-4 self-start sm:grid-cols-2">
            {featureCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className="rounded-[30px] bg-white/12 p-5 backdrop-blur">
                  <div className="inline-flex rounded-2xl bg-white/15 p-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-100/85">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Как это работает</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <div key={item.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{item.step}</div>
              <p className="mt-4 text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Что делает сервис</p>
          <div className="mt-5 grid gap-4">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-base font-semibold text-slate-950">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Для кого</p>
          <div className="mt-5 grid gap-4">
            {roleCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-base font-semibold text-slate-950">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Почему удобно</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">StudyBuddy выглядит как продукт, а не как разрозненный портал</h2>
          </div>
          <button
            onClick={() => onNavigate('/register')}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Попробовать StudyBuddy
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {benefitCards.map((item) => (
            <div key={item} className="rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
