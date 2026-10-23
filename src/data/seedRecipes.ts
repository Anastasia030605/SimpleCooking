import type { Recipe } from '../domain/recipe';

/** Примеры для каталога до появления рецептов, созданных через форму. */
export const seedRecipes: Recipe[] = [
  {
    id: 'sample-chicken-tomatoes',
    title: 'Курица с томатами и травами',
    category: 'Основные блюда',
    description: 'Простой ужин с сочными томатами и ароматными травами.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    baseServings: 4,
    ingredients: [
      { id: 'chicken', name: 'Куриное филе', amount: 600, unit: 'г' },
      { id: 'tomatoes', name: 'Томаты', amount: 400, unit: 'г' },
      { id: 'basil', name: 'Базилик', amount: 20, unit: 'г' },
    ],
    steps: [
      { id: 'step-1', text: 'Нарежьте курицу и обжарьте до золотистой корочки.' },
      { id: 'step-2', text: 'Добавьте томаты и тушите до готовности.' },
    ],
    authorId: 'test-user',
    createdAt: '2026-10-20T12:00:00.000Z',
  },
  {
    id: 'sample-pasta-vegetables',
    title: 'Паста с овощами',
    category: 'Основные блюда',
    description: 'Быстрое блюдо для обеда или ужина.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    baseServings: 2,
    ingredients: [
      { id: 'pasta', name: 'Паста', amount: 200, unit: 'г' },
      { id: 'pepper', name: 'Сладкий перец', amount: 1, unit: 'шт.' },
    ],
    steps: [
      { id: 'step-1', text: 'Отварите пасту.' },
      { id: 'step-2', text: 'Обжарьте овощи и смешайте с пастой.' },
    ],
    authorId: 'test-user',
    createdAt: '2026-10-19T12:00:00.000Z',
  },
  {
    id: 'sample-pumpkin-soup',
    title: 'Тыквенный суп',
    category: 'Супы',
    description: 'Нежный сезонный суп-пюре.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    baseServings: 6,
    ingredients: [
      { id: 'pumpkin', name: 'Тыква', amount: 900, unit: 'г' },
      { id: 'cream', name: 'Сливки', amount: 150, unit: 'мл' },
    ],
    steps: [
      { id: 'step-1', text: 'Нарежьте тыкву и отварите до мягкости.' },
      { id: 'step-2', text: 'Измельчите блендером и добавьте сливки.' },
    ],
    authorId: 'test-user',
    createdAt: '2026-10-18T12:00:00.000Z',
  },
];
