/* ===== Документ: Извещение об обращениях лиц с суицидальным риском ===== */
window.SMP = window.SMP || {};
window.SMP.documents = window.SMP.documents || {};

window.SMP.documents.suicideReport = `
<style>
  .sr-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sr-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    box-shadow: var(--shadow);
  }

  .sr-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 800;
    color: var(--accent);
    margin: 0 0 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }

  .sr-card-title-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .sr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sr-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: var(--menu-icon-bg);
    border-radius: 10px;
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .sr-list-icon {
    flex: 0 0 auto;
    font-size: 1rem;
    line-height: 1.3;
  }

  .sr-list-text {
    flex: 1;
    font-weight: 600;
  }

  .sr-note {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: rgba(183, 121, 31, 0.10);
    border-left: 4px solid #b7791f;
    border-radius: 8px;
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .sr-note-icon {
    flex: 0 0 auto;
    font-size: 1.1rem;
  }

  .sr-note-text {
    flex: 1;
  }
</style>

<div class="sr-container">

  <div class="sr-note">
    <span class="sr-note-icon">⚠️</span>
    <span class="sr-note-text">
      <strong>Важно:</strong> информация о лицах, совершивших суицидальную попытку (самоповреждение), 
      передаётся в оперативный отдел согласно установленной форме. Доклад обязателен при каждом таком вызове.
    </span>
  </div>

  <div class="sr-card">
    <h3 class="sr-card-title">
      <span class="sr-card-title-icon">📋</span>
      Обязательные пункты доклада
    </h3>
    <ul class="sr-list">
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Фамилия Имя Отчество</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Возраст</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Адрес вызова</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Адрес регистрации</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Диагноз</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Сведения о законном представителе (для несовершеннолетнего): Ф.И.О.</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Социальный статус</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Семейное положение</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Наличие хронических и инвалидизирующих заболеваний</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Наличие суицидальных попыток в анамнезе</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Причины попытки: отсутствие работы, долговые обязательства, неблагополучная семейная обстановка, заболевания, под влиянием алкоголя или ПАВ, иные причины</span></li>
      <li><span class="sr-list-icon">👉</span><span class="sr-list-text">Учреждение здравоохранения (куда направлен / госпитализирован)</span></li>
    </ul>
  </div>

</div>
`;