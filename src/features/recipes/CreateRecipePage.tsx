import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { saveRecipe } from '../../data/recipeStore';
import { emptyIngredient, emptyRecipe, emptyStep, toRecipe, validateRecipe } from './recipe-form';
import type { FormErrors, RecipeFormValues } from './recipe-form';

export function CreateRecipePage() {
  const [values, setValues] = useState(emptyRecipe);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  function update<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues(current => ({ ...current, [key]: value }));
    setErrors({});
    setSaveError('');
  }
  function focusLater(id: string) {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    const nextErrors = validateRecipe(values);
    setErrors(nextErrors);
    setSaveError('');
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setIsSaving(true);
    try {
      const recipe = toRecipe(values);
      saveRecipe(recipe);
      navigate(`/recipes/${encodeURIComponent(recipe.id)}`, { state: { published: true } });
    } catch {
      setSaveError('Не удалось сохранить рецепт. Проверьте доступность хранилища браузера. Введённые данные остались в форме.');
      setIsSaving(false);
    }
  }

  return (
    <div className="create-recipe-page">
      <header className="page-intro">
        <p className="eyebrow">Ваша кулинарная книга</p>
        <h1>Новый рецепт</h1>
        <p>Поделитесь блюдом в общем каталоге. Поля со знаком * обязательны.</p>
      </header>
      <p className="form-notice">Демонстрационная версия: публикации сохраняются только в этом браузере. Автор — тестовый пользователь.</p>
      <form ref={formRef} className="recipe-form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="message-panel">Не удалось опубликовать рецепт. Исправьте отмеченные поля.</div>
        )}
        {saveError && <div role="alert" className="message-panel">{saveError}</div>}
        <section className="form-panel" aria-labelledby="basics-heading">
          <h2 id="basics-heading">О рецепте</h2>
          <Input id="title" label="Название *" value={values.title} required error={errors.title} onChange={e => update('title', e.target.value)} />
          <Input id="category" label="Категория *" placeholder="Например, Завтраки" value={values.category} required error={errors.category} onChange={e => update('category', e.target.value)} />
          <div className="field">
            <label className="field__label" htmlFor="description">Описание (необязательно)</label>
            <textarea className="field__input" id="description" rows={3} value={values.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div className="form-columns">
            <Input id="prepTimeMinutes" label="Подготовка, минут *" type="number" min="0" step="1" value={values.prepTimeMinutes} required error={errors.prepTimeMinutes} onChange={e => update('prepTimeMinutes', e.target.value)} />
            <Input id="cookTimeMinutes" label="Приготовление, минут *" type="number" min="0" step="1" value={values.cookTimeMinutes} required error={errors.cookTimeMinutes} onChange={e => update('cookTimeMinutes', e.target.value)} />
            <Input id="baseServings" label="Порции *" type="number" min="1" step="1" value={values.baseServings} required error={errors.baseServings} onChange={e => update('baseServings', e.target.value)} />
          </div>
          <Input id="imageUrl" label="Ссылка на фотографию (необязательно)" type="url" placeholder="https://example.com/photo.jpg" value={values.imageUrl} error={errors.imageUrl} onChange={e => update('imageUrl', e.target.value)} />
          <Input id="imageAlt" label={values.imageUrl.trim() ? 'Описание фотографии *' : 'Описание фотографии (если добавлена фотография)'} value={values.imageAlt} required={!!values.imageUrl.trim()} error={errors.imageAlt} onChange={e => update('imageAlt', e.target.value)} />
        </section>
        <section className="form-panel" aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading">Ингредиенты</h2>
          <p>Количество — на указанное число порций. Дроби можно записывать через запятую или точку.</p>
          {values.ingredients.map((item, index) => (
            <fieldset className="form-item" key={item.id}>
              <legend>Ингредиент {index + 1}</legend>
              <Input id={`name-${item.id}`} label="Название ингредиента *" value={item.name} required error={errors[`name-${item.id}`]} onChange={e => update('ingredients', values.ingredients.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} />
              <label className="form-checkbox">
                <input type="checkbox" checked={item.toTaste} onChange={e => update('ingredients', values.ingredients.map(i => i.id === item.id ? { ...i, toTaste: e.target.checked } : i))} />
                По вкусу — без числового количества
              </label>
              {!item.toTaste && <div className="form-columns">
                <Input id={`amount-${item.id}`} label="Количество *" inputMode="decimal" value={item.amount} required error={errors[`amount-${item.id}`]} onChange={e => update('ingredients', values.ingredients.map(i => i.id === item.id ? { ...i, amount: e.target.value } : i))} />
                <Input id={`unit-${item.id}`} label="Единица измерения *" value={item.unit} required error={errors[`unit-${item.id}`]} onChange={e => update('ingredients', values.ingredients.map(i => i.id === item.id ? { ...i, unit: e.target.value } : i))} />
              </div>}
              <Button type="button" variant="secondary" disabled={values.ingredients.length === 1} aria-label={`Удалить ингредиент ${index + 1}`} onClick={() => {
                update('ingredients', values.ingredients.filter(i => i.id !== item.id));
                setAnnouncement(`Ингредиент ${index + 1} удалён.`);
                focusLater('add-ingredient');
              }}>Удалить ингредиент</Button>
            </fieldset>
          ))}
          <Button id="add-ingredient" type="button" variant="secondary" onClick={() => {
            const item = emptyIngredient();
            update('ingredients', [...values.ingredients, item]);
            focusLater(`name-${item.id}`);
          }}>Добавить ингредиент</Button>
        </section>
        <section className="form-panel" aria-labelledby="steps-heading">
          <h2 id="steps-heading">Приготовление</h2>
          {values.steps.map((step, index) => {
            const id = `text-${step.id}`;
            return <fieldset className="form-item" key={step.id}>
              <legend>Шаг {index + 1}</legend>
              <div className="field">
                <label className="field__label" htmlFor={id}>Что нужно сделать *</label>
                <textarea className="field__input" id={id} rows={3} required value={step.text}
                  aria-invalid={errors[id] ? true : undefined} aria-describedby={errors[id] ? `${id}-error` : undefined}
                  onChange={e => update('steps', values.steps.map(s => s.id === step.id ? { ...s, text: e.target.value } : s))} />
                {errors[id] && <p className="field__error" id={`${id}-error`}>{errors[id]}</p>}
              </div>
              <Button type="button" variant="secondary" disabled={values.steps.length === 1} aria-label={`Удалить шаг ${index + 1}`} onClick={() => {
                update('steps', values.steps.filter(s => s.id !== step.id));
                setAnnouncement(`Шаг ${index + 1} удалён.`);
                focusLater('add-step');
              }}>Удалить шаг</Button>
            </fieldset>;
          })}
          <Button id="add-step" type="button" variant="secondary" onClick={() => {
            const step = emptyStep();
            update('steps', [...values.steps, step]);
            focusLater(`text-${step.id}`);
          }}>Добавить шаг</Button>
        </section>
        <p className="visually-hidden" role="status">{announcement}</p>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Сохранение…' : 'Опубликовать рецепт'}</Button>
      </form>
    </div>
  );
}
