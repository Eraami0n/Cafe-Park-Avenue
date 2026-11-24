# Cafe Park Avenue — Landing Page & Adaptive Feedback Form

Адаптивний вебсайт (лендинг) для крафтової кондитерської та кав'ярні **«Cafe Park Avenue»** (м. Монастирище, вул. Соборна, 132), розроблений у межах курсу **«Технології веброзробки та дизайну»** (Лабораторні роботи №5–9).

## Демо-посилання (Live Deploy)
- **Vercel (CI/CD, ЛР №9):** https://cafe-park-avenue.vercel.app/
- **GitHub Pages:** https://eraami0n.github.io/Cafe-Park-Avenue/
- **Netlify:** https://cafe-parkavenue.netlify.app/

## Основні можливості
- Адаптивна Mobile-First верстка (смартфони, планшети, десктоп) на базі Tailwind CSS
- Семантична структура HTML5 та доступність (a11y: `label/for`, `aria-invalid`, `aria-describedby`, `role="dialog"`, клавіатурна навігація)
- **Адаптивна форма зворотного зв’язку (ЛР №9)** з динамічною клієнтською валідацією (`input`, `blur`, `submit`) через регулярні вирази (RegEx), візуалізацією 4 UI-станів (`Normal`, `Focus`, `Error`, `Success`), безпечною обробкою телефонних Edge Cases (`+380XXXXXXXXX`) та кастомним модальним вікном успіху
- Каталог авторських десертів, круасанів та тортів із візуальними картками
- Інтерактивний конструктор торта на замовлення
- Інтегрована відеопрезентація YouTube, інтерактивна карта Google Maps та сайдбар живих інформерів (`<aside>`)

## Стек технологій
- **HTML5** — семантична розмітка сторінки та форм
- **CSS3** + **Tailwind CSS** — стилізація, брендова дизайн-система та адаптивність
- **Vanilla JavaScript (ES6+)** — клієнтська RegEx-валідація, обробка Edge Cases та керування модальним вікном
- **Git / GitHub** — контроль версій та історія розробки за стандартом Conventional Commits
- **Vercel**, **GitHub Pages** & **Netlify** — хмарний хостинг та безперервне розгортання (CI/CD)

## Структура проєкту
```text
Cafe-Park-Avenue/
├── index.html             # Головна сторінка лендингу з формою зворотного зв'язку
├── css/
│   └── style.css          # Кастомні стилі, змінні :root та анімації
├── assets/
│   ├── js/
│   │   └── validation.js  # Клієнтська валідація форми, RegEx та логіка модального вікна
│   ├── icons/             # SVG-іконки інтерфейсу
│   └── images/            # Оптимізовані зображення десертів та логотип
├── .gitignore             # Виключення службових та тимчасових файлів
└── README.md              # Документація проєкту
```

## Локальний запуск
1. Клонуйте репозиторій:
   ```bash
   git clone https://github.com/Eraami0n/Cafe-Park-Avenue.git
   cd Cafe-Park-Avenue
   ```
2. Відкрийте файл `index.html` у браузері або запустіть через розширення **Live Server** у Visual Studio Code.

## Автор
- **Прилуцький Денис** (група ПП-24, НУ «Львівська політехніка»)
- GitHub: [@Eraami0n](https://github.com/Eraami0n)
