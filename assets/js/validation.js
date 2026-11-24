/**
 * Cafe Park Avenue — Лабораторна робота №9
 * Тема: Адаптивні форми зворотного зв'язку та клієнтська валідація
 * Стек: HTML5 + Tailwind CSS + Vanilla JavaScript (без сторонніх бібліотек)
 */

// ========================================================
// 1. КОНСТАНТИ РЕГУЛЯРНИХ ВИРАЗІВ (RegEx) ТА ОБМЕЖЕНЬ
// ========================================================

// Ім'я: українські (включно з І, Ї, Є, Ґ) та латинські літери, пробіл, дефіс, апостроф (2–60 символів)
const REGEX_NAME = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'ʼ’\- ]{2,60}$/;

// Класичний шаблон перевірки структури електронної пошти (локальна частина + @ + домен + .TLD >= 2 літер)
const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Строгий український стандарт номера телефону: префікс +380 та рівно 9 цифр після нього
const REGEX_PHONE = /^\+380\d{9}$/;

// Перевірка на спробу вставлення HTML-розмітки або скриптів (захист від XSS на рівні вводу)
const REGEX_HTML_TAGS = /<[^>]*>/;

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 500;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    // Елементи полів форми
    const nameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const topicSelect = document.getElementById('topic');
    const messageInput = document.getElementById('message');
    const agreementInput = document.getElementById('agreement');
    const submitBtn = document.getElementById('submitFeedbackBtn');

    // Елементи помилок, іконок стану та UX-підказок
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const phoneError = document.getElementById('phoneError');
    const messageError = document.getElementById('messageError');
    const agreementError = document.getElementById('agreementError');
    const agreementWrapper = document.getElementById('agreementWrapper');

    const usernameIcon = document.getElementById('usernameStatusIcon');
    const emailIcon = document.getElementById('emailStatusIcon');
    const phoneIcon = document.getElementById('phoneStatusIcon');

    const phoneSuggestionWrap = document.getElementById('phoneSuggestionWrap');
    const phoneSuggestionBtn = document.getElementById('phoneSuggestionBtn');
    const messageCounter = document.getElementById('messageCounter');

    // Елементи модального вікна успіху
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalIconBtn = document.getElementById('closeModalIconBtn');
    const modalSummary = document.getElementById('modalSummary');

    // Множина полів, із якими користувач уже завершив первинну взаємодію (blur або submit)
    const touchedFields = new Set();
    let isSubmitting = false;
    let lastFocusedElement = null;

    // ========================================================
    // 2. ФУНКЦІЇ КЕРУВАННЯ UI-СТАНАМИ (Normal / Error / Success)
    // ========================================================

    function showError(inputEl, errorEl, message, iconEl = null) {
        inputEl.classList.remove(
            'border-gray-300',
            'border-green-500',
            'bg-emerald-50/30',
            'focus:border-brand-forest',
            'focus-visible:ring-brand-forest/30'
        );
        inputEl.classList.add(
            'border-red-500',
            'bg-red-50/40',
            'focus:border-red-500',
            'focus-visible:ring-red-500/30'
        );
        inputEl.setAttribute('aria-invalid', 'true');

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }

        if (iconEl) {
            iconEl.textContent = '!';
            iconEl.classList.remove('hidden', 'text-emerald-600');
            iconEl.classList.add('flex', 'text-red-600');
        }
    }

    function showSuccess(inputEl, errorEl, iconEl = null) {
        inputEl.classList.remove(
            'border-gray-300',
            'border-red-500',
            'bg-red-50/40',
            'focus:border-red-500',
            'focus-visible:ring-red-500/30'
        );
        inputEl.classList.add(
            'border-green-500',
            'bg-emerald-50/30',
            'focus:border-brand-forest',
            'focus-visible:ring-brand-forest/30'
        );
        inputEl.setAttribute('aria-invalid', 'false');

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }

        if (iconEl) {
            iconEl.textContent = '✓';
            iconEl.classList.remove('hidden', 'text-red-600');
            iconEl.classList.add('flex', 'text-emerald-600');
        }
    }

    function clearError(inputEl, errorEl, iconEl = null) {
        inputEl.classList.remove(
            'border-red-500',
            'bg-red-50/40',
            'border-green-500',
            'bg-emerald-50/30',
            'focus:border-red-500',
            'focus-visible:ring-red-500/30'
        );
        inputEl.classList.add(
            'border-gray-300',
            'bg-white',
            'focus:border-brand-forest',
            'focus-visible:ring-brand-forest/30'
        );
        inputEl.setAttribute('aria-invalid', 'false');

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }

        if (iconEl) {
            iconEl.textContent = '';
            iconEl.classList.remove('flex', 'text-red-600', 'text-emerald-600');
            iconEl.classList.add('hidden');
        }
    }

    // ========================================================
    // 3. ДОПОМІЖНА БЕЗПЕЧНА UX-ЛОГІКА ДЛЯ НОМЕРА ТЕЛЕФОНУ (Етап 10)
    // ========================================================

    /**
     * Аналізує введений телефон і, якщо його можна однозначно привести до +380XXXXXXXXX
     * (наприклад, 0501234567 або +380 (50) 123-45-67), пропонує користувачу кнопку підстановки,
     * не приховуючи помилку та не змінюючи текст примусово.
     */
    function getNormalizedPhoneCandidate(raw) {
        const cleaned = raw.replace(/[\s()-]/g, '');
        if (/^0\d{9}$/.test(cleaned)) {
            return '+38' + cleaned;
        }
        if (/^380\d{9}$/.test(cleaned)) {
            return '+' + cleaned;
        }
        if (/^\+380\d{9}$/.test(cleaned) && cleaned !== raw) {
            return cleaned;
        }
        return null;
    }

    function updatePhoneSuggestion(raw) {
        const candidate = getNormalizedPhoneCandidate(raw);
        if (candidate && candidate !== raw) {
            phoneSuggestionBtn.dataset.suggestedPhone = candidate;
            phoneSuggestionBtn.textContent = `Використати формат ${candidate}`;
            phoneSuggestionWrap.classList.remove('hidden');
        } else {
            delete phoneSuggestionBtn.dataset.suggestedPhone;
            phoneSuggestionBtn.textContent = '';
            phoneSuggestionWrap.classList.add('hidden');
        }
    }

    phoneSuggestionBtn.addEventListener('click', () => {
        const suggested = phoneSuggestionBtn.dataset.suggestedPhone;
        if (suggested) {
            phoneInput.value = suggested;
            touchedFields.add('phone');
            validatePhone();
            phoneInput.focus();
        }
    });

    // ========================================================
    // 4. ОКРЕМІ ФУНКЦІЇ ВАЛІДАЦІЇ ПОЛІВ (Етап 8)
    // ========================================================

    function validateName() {
        const value = nameInput.value.trim().replace(/\s{2,}/g, ' ');

        if (value.length === 0) {
            showError(nameInput, nameError, "Будь ласка, введіть ваше ім'я.", usernameIcon);
            return false;
        }
        if (value.length < 2) {
            showError(nameInput, nameError, "Ім'я повинно містити щонайменше 2 символи.", usernameIcon);
            return false;
        }
        if (REGEX_HTML_TAGS.test(value)) {
            showError(nameInput, nameError, "Ім'я не може містити HTML-теги.", usernameIcon);
            return false;
        }
        if (!REGEX_NAME.test(value) || /^[-'ʼ’]|[-'ʼ’]$/.test(value)) {
            showError(
                nameInput,
                nameError,
                "Використовуйте лише українські або латинські літери, пробіл, апостроф чи дефіс (без цифр і спецсимволів).",
                usernameIcon
            );
            return false;
        }

        showSuccess(nameInput, nameError, usernameIcon);
        return true;
    }

    function validateEmail() {
        const value = emailInput.value.trim();

        if (value.length === 0) {
            showError(emailInput, emailError, 'Будь ласка, введіть адресу електронної пошти.', emailIcon);
            return false;
        }
        if (!REGEX_EMAIL.test(value)) {
            showError(
                emailInput,
                emailError,
                'Введіть коректну електронну адресу (наприклад: user@gmail.com).',
                emailIcon
            );
            return false;
        }

        showSuccess(emailInput, emailError, emailIcon);
        return true;
    }

    function validatePhone() {
        const rawValue = phoneInput.value.trim();
        updatePhoneSuggestion(rawValue);

        if (rawValue.length === 0) {
            showError(phoneInput, phoneError, 'Будь ласка, введіть номер телефону у форматі +380XXXXXXXXX.', phoneIcon);
            return false;
        }
        if (/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(rawValue)) {
            showError(phoneInput, phoneError, 'Номер телефону не може містити літери — введіть +380 та 9 цифр.', phoneIcon);
            return false;
        }
        if (/[\s()-]/.test(rawValue)) {
            showError(phoneInput, phoneError, 'Введіть номер без пробілів, дужок та дефісів: +380XXXXXXXXX.', phoneIcon);
            return false;
        }
        if (/^0\d*$/.test(rawValue)) {
            showError(phoneInput, phoneError, 'Номер повинен починатися з коду України +380 (наприклад: +380501234567).', phoneIcon);
            return false;
        }
        if (/^\+380\d+$/.test(rawValue) && rawValue.length !== 13) {
            const digitsCount = rawValue.length - 4;
            showError(
                phoneInput,
                phoneError,
                `Після +380 має бути рівно 9 цифр (зараз введено ${digitsCount}).`,
                phoneIcon
            );
            return false;
        }
        if (!REGEX_PHONE.test(rawValue)) {
            showError(phoneInput, phoneError, 'Формат номера має бути строго українським: +380XXXXXXXXX.', phoneIcon);
            return false;
        }

        showSuccess(phoneInput, phoneError, phoneIcon);
        return true;
    }

    function updateMessageCounter() {
        const currentLen = messageInput.value.trim().length;
        messageCounter.textContent = `${currentLen} / ${MAX_MESSAGE_LENGTH}`;
    }

    function validateMessage() {
        const value = messageInput.value.trim();
        updateMessageCounter();

        if (value.length === 0) {
            showError(messageInput, messageError, 'Будь ласка, напишіть текст повідомлення.');
            return false;
        }
        if (REGEX_HTML_TAGS.test(value)) {
            showError(messageInput, messageError, 'Текст повідомлення не може містити HTML-теги або скрипти.');
            return false;
        }
        if (value.length < MIN_MESSAGE_LENGTH) {
            showError(
                messageInput,
                messageError,
                `Повідомлення занадто коротке: мінімум ${MIN_MESSAGE_LENGTH} символів (зараз ${value.length}).`
            );
            return false;
        }
        if (value.length > MAX_MESSAGE_LENGTH) {
            showError(messageInput, messageError, `Максимальна довжина повідомлення — ${MAX_MESSAGE_LENGTH} символів.`);
            return false;
        }

        showSuccess(messageInput, messageError);
        return true;
    }

    function validateAgreement() {
        if (!agreementInput.checked) {
            agreementInput.setAttribute('aria-invalid', 'true');
            agreementWrapper.classList.remove('border-gray-200', 'border-green-500', 'bg-emerald-50/30');
            agreementWrapper.classList.add('border-red-500', 'bg-red-50/40');
            agreementError.textContent = 'Необхідно підтвердити згоду з політикою конфіденційності.';
            agreementError.classList.remove('hidden');
            return false;
        }

        agreementInput.setAttribute('aria-invalid', 'false');
        agreementWrapper.classList.remove('border-gray-200', 'border-red-500', 'bg-red-50/40');
        agreementWrapper.classList.add('border-green-500', 'bg-emerald-50/30');
        agreementError.textContent = '';
        agreementError.classList.add('hidden');
        return true;
    }

    function resetFormVisualState() {
        clearError(nameInput, nameError, usernameIcon);
        clearError(emailInput, emailError, emailIcon);
        clearError(phoneInput, phoneError, phoneIcon);
        clearError(messageInput, messageError);

        agreementInput.setAttribute('aria-invalid', 'false');
        agreementWrapper.classList.remove('border-red-500', 'bg-red-50/40', 'border-green-500', 'bg-emerald-50/30');
        agreementWrapper.classList.add('border-gray-200', 'bg-brand-hero/80');
        agreementError.textContent = '';
        agreementError.classList.add('hidden');

        updatePhoneSuggestion('');
        updateMessageCounter();
        touchedFields.clear();
    }

    // ========================================================
    // 5. ДИНАМІЧНА ВАЛІДАЦІЯ ПІД ЧАС ВЗАЄМОДІЇ (Етап 9)
    // ========================================================

    function bindDynamicValidation(inputEl, validatorFn) {
        // Подія blur: фіксує завершення першого введення в поле та показує підсумковий стан
        inputEl.addEventListener('blur', () => {
            touchedFields.add(inputEl.id);
            validatorFn();
        });

        // Подія input: якщо поле вже було перевірене (blur/submit), оновлює стан миттєво;
        // до першого blur не лякає користувача передчасною червоною рамкою, але показує успіх або UX-підказку
        inputEl.addEventListener('input', () => {
            if (inputEl === messageInput) {
                updateMessageCounter();
            }
            if (inputEl === phoneInput) {
                updatePhoneSuggestion(phoneInput.value.trim());
            }

            if (touchedFields.has(inputEl.id)) {
                validatorFn();
            } else {
                const raw = inputEl.value.trim();
                if (
                    (inputEl === nameInput && REGEX_NAME.test(raw)) ||
                    (inputEl === emailInput && REGEX_EMAIL.test(raw)) ||
                    (inputEl === phoneInput && REGEX_PHONE.test(raw)) ||
                    (inputEl === messageInput && raw.length >= MIN_MESSAGE_LENGTH && !REGEX_HTML_TAGS.test(raw))
                ) {
                    validatorFn();
                }
            }
        });
    }

    bindDynamicValidation(nameInput, validateName);
    bindDynamicValidation(emailInput, validateEmail);
    bindDynamicValidation(phoneInput, validatePhone);
    bindDynamicValidation(messageInput, validateMessage);

    agreementInput.addEventListener('change', () => {
        touchedFields.add('agreement');
        validateAgreement();
    });

    // ========================================================
    // 6. ДОСТУПНЕ МОДАЛЬНЕ ВІКНО ТА УТРИМАННЯ ФОКУСУ (Етапи 11, 12, 16)
    // ========================================================

    function populateModalSummary(data) {
        modalSummary.textContent = '';
        const rows = [
            ['Ім’я:', data.name],
            ['Email:', data.email],
            ['Телефон:', data.phone],
            ['Тема:', data.topicLabel],
        ];

        rows.forEach(([label, val]) => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.className = 'text-brand-forest font-semibold';
            strong.textContent = `${label} `;
            const span = document.createElement('span');
            span.textContent = val;
            p.appendChild(strong);
            p.appendChild(span);
            modalSummary.appendChild(p);
        });
    }

    function openSuccessModal(submittedData) {
        lastFocusedElement = document.activeElement;
        populateModalSummary(submittedData);

        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');

        closeModalBtn.focus();
    }

    function closeSuccessModal() {
        if (successModal.classList.contains('hidden')) return;

        successModal.classList.remove('flex');
        successModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        } else {
            submitBtn.focus();
        }
    }

    closeModalBtn.addEventListener('click', closeSuccessModal);
    closeModalIconBtn.addEventListener('click', closeSuccessModal);

    // Закриття при кліку виключно на затемнений оверлей (не закривається при кліку всередині білої картки)
    successModal.addEventListener('click', (event) => {
        if (event.target === successModal) {
            closeSuccessModal();
        }
    });

    // Клавіатурне керування модальним вікном: Escape та Focus Trap (Tab / Shift + Tab)
    document.addEventListener('keydown', (event) => {
        if (successModal.classList.contains('hidden')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeSuccessModal();
            return;
        }

        if (event.key === 'Tab') {
            const focusable = successModal.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;

            const firstEl = focusable[0];
            const lastEl = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === firstEl) {
                event.preventDefault();
                lastEl.focus();
            } else if (!event.shiftKey && document.activeElement === lastEl) {
                event.preventDefault();
                firstEl.focus();
            }
        }
    });

    // ========================================================
    // 7. ОБРОБКА ПОДІЇ НАДСИЛАННЯ ФОРМИ (Submit Event)
    // ========================================================

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Блокуємо стандартне перезавантаження сторінки браузером
        if (isSubmitting) return;

        isSubmitting = true;
        ['username', 'email', 'phone', 'message', 'agreement'].forEach((id) => touchedFields.add(id));

        // Запускаємо валідацію всіх полів одночасно, щоб показати всі наявні помилки
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const isMessageValid = validateMessage();
        const isAgreementValid = validateAgreement();

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isMessageValid || !isAgreementValid) {
            // Переносимо клавіатурний фокус на перше невалідне поле для зручності користувача (a11y)
            const firstInvalid = [
                [isNameValid, nameInput],
                [isEmailValid, emailInput],
                [isPhoneValid, phoneInput],
                [isMessageValid, messageInput],
                [isAgreementValid, agreementInput],
            ].find(([valid]) => !valid);

            if (firstInvalid && firstInvalid[1]) {
                firstInvalid[1].focus();
            }
            isSubmitting = false;
            return;
        }

        const selectedTopicOption = topicSelect.options[topicSelect.selectedIndex];
        const submittedSnapshot = {
            name: nameInput.value.trim().replace(/\s{2,}/g, ' '),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            topicLabel: selectedTopicOption ? selectedTopicOption.text : 'Загальне звернення',
        };

        // Очищуємо всі поля форми та повертаємо стилі рамок до дефолтного стану Normal
        form.reset();
        resetFormVisualState();

        // Показуємо модальне вікно імітації успішного надсилання
        openSuccessModal(submittedSnapshot);
        isSubmitting = false;
    });
});
