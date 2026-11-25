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
    const cakeForm = document.getElementById('cakeBuilderForm');
    const newsletterForm = document.getElementById('newsletterForm');

    // Елементи модального вікна успіху (спільне для форм лендингу)
    const successModal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalIconBtn = document.getElementById('closeModalIconBtn');
    const modalSummary = document.getElementById('modalSummary');

    const touchedFields = new Set();
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
        if (!inputEl) return;
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
    // 3. ДОПОМІЖНІ УНІВЕРСАЛЬНІ ПЕРЕВІРКИ ПОЛІВ (DRY)
    // ========================================================

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

    function updatePhoneSuggestionUI(raw, wrapEl, btnEl) {
        if (!wrapEl || !btnEl) return;
        const candidate = getNormalizedPhoneCandidate(raw);
        if (candidate && candidate !== raw) {
            btnEl.dataset.suggestedPhone = candidate;
            btnEl.textContent = `Використати формат ${candidate}`;
            wrapEl.classList.remove('hidden');
        } else {
            delete btnEl.dataset.suggestedPhone;
            btnEl.textContent = '';
            wrapEl.classList.add('hidden');
        }
    }

    function checkNameField(inputEl, errorEl, iconEl) {
        const value = inputEl.value.trim().replace(/\s{2,}/g, ' ');

        if (value.length === 0) {
            showError(inputEl, errorEl, "Будь ласка, введіть ваше ім'я.", iconEl);
            return false;
        }
        if (value.length < 2) {
            showError(inputEl, errorEl, "Ім'я повинно містити щонайменше 2 символи.", iconEl);
            return false;
        }
        if (REGEX_HTML_TAGS.test(value)) {
            showError(inputEl, errorEl, "Ім'я не може містити HTML-теги.", iconEl);
            return false;
        }
        if (!REGEX_NAME.test(value) || /^[-'ʼ’]|[-'ʼ’]$/.test(value)) {
            showError(
                inputEl,
                errorEl,
                "Використовуйте лише українські або латинські літери, пробіл, апостроф чи дефіс (без цифр і спецсимволів).",
                iconEl
            );
            return false;
        }

        showSuccess(inputEl, errorEl, iconEl);
        return true;
    }

    function checkPhoneField(inputEl, errorEl, iconEl, suggestionWrapEl = null, suggestionBtnEl = null) {
        const rawValue = inputEl.value.trim();
        updatePhoneSuggestionUI(rawValue, suggestionWrapEl, suggestionBtnEl);

        if (rawValue.length === 0) {
            showError(inputEl, errorEl, 'Будь ласка, введіть номер телефону у форматі +380XXXXXXXXX.', iconEl);
            return false;
        }
        if (/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(rawValue)) {
            showError(inputEl, errorEl, 'Номер телефону не може містити літери — введіть +380 та 9 цифр.', iconEl);
            return false;
        }
        if (/[\s()-]/.test(rawValue)) {
            showError(inputEl, errorEl, 'Введіть номер без пробілів, дужок та дефісів: +380XXXXXXXXX.', iconEl);
            return false;
        }
        if (/^0\d*$/.test(rawValue)) {
            showError(inputEl, errorEl, 'Номер повинен починатися з коду України +380 (наприклад: +380688231448).', iconEl);
            return false;
        }
        if (/^\+380\d+$/.test(rawValue) && rawValue.length !== 13) {
            const digitsCount = rawValue.length - 4;
            showError(
                inputEl,
                errorEl,
                `Після +380 має бути рівно 9 цифр (зараз введено ${digitsCount}).`,
                iconEl
            );
            return false;
        }
        if (!REGEX_PHONE.test(rawValue)) {
            showError(inputEl, errorEl, 'Формат номера має бути строго українським: +380XXXXXXXXX.', iconEl);
            return false;
        }

        showSuccess(inputEl, errorEl, iconEl);
        return true;
    }

    // ========================================================
    // 4. ДОСТУПНЕ МОДАЛЬНЕ ВІКНО ТА УТРИМАННЯ ФОКУСУ (Етапи 11, 12, 16)
    // ========================================================

    function populateModalSummary(rows) {
        modalSummary.textContent = '';
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

    function openSuccessModal({
        title = 'Дякуємо за звернення!',
        description = 'Форма успішно пройшла клієнтську валідацію. Демонстрація успішного надсилання (імітація без підключення бекенд-сервера).',
        rows = [],
    }) {
        if (!successModal) return;
        lastFocusedElement = document.activeElement;

        if (modalTitle) modalTitle.textContent = title;
        if (modalDesc) modalDesc.textContent = description;
        populateModalSummary(rows);

        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');

        if (closeModalBtn) closeModalBtn.focus();
    }

    function closeSuccessModal() {
        if (!successModal || successModal.classList.contains('hidden')) return;

        successModal.classList.remove('flex');
        successModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSuccessModal);
    if (closeModalIconBtn) closeModalIconBtn.addEventListener('click', closeSuccessModal);

    if (successModal) {
        // Закриття при кліку виключно на затемнений оверлей (не закривається при кліку всередині білої картки)
        successModal.addEventListener('click', (event) => {
            if (event.target === successModal) {
                closeSuccessModal();
            }
        });
    }

    // Клавіатурне керування модальним вікном: Escape та Focus Trap (Tab / Shift + Tab)
    document.addEventListener('keydown', (event) => {
        if (!successModal || successModal.classList.contains('hidden')) return;

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
    // 5. ОСНОВНА ФОРМА ЗВОРОТНОГО ЗВ'ЯЗКУ (#feedbackForm)
    // ========================================================

    if (form) {
        const nameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const topicSelect = document.getElementById('topic');
        const messageInput = document.getElementById('message');
        const agreementInput = document.getElementById('agreement');

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

        let isSubmittingFeedback = false;

        function validateName() {
            return checkNameField(nameInput, nameError, usernameIcon);
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
            return checkPhoneField(phoneInput, phoneError, phoneIcon, phoneSuggestionWrap, phoneSuggestionBtn);
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

        function resetFeedbackFormVisualState() {
            clearError(nameInput, nameError, usernameIcon);
            clearError(emailInput, emailError, emailIcon);
            clearError(phoneInput, phoneError, phoneIcon);
            clearError(messageInput, messageError);

            agreementInput.setAttribute('aria-invalid', 'false');
            agreementWrapper.classList.remove('border-red-500', 'bg-red-50/40', 'border-green-500', 'bg-emerald-50/30');
            agreementWrapper.classList.add('border-gray-200', 'bg-brand-hero/80');
            agreementError.textContent = '';
            agreementError.classList.add('hidden');

            updatePhoneSuggestionUI('', phoneSuggestionWrap, phoneSuggestionBtn);
            updateMessageCounter();
            ['username', 'email', 'phone', 'message', 'agreement'].forEach((id) => touchedFields.delete(id));
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

        function bindDynamicValidation(inputEl, validatorFn) {
            inputEl.addEventListener('blur', () => {
                touchedFields.add(inputEl.id);
                validatorFn();
            });

            inputEl.addEventListener('input', () => {
                if (inputEl === messageInput) {
                    updateMessageCounter();
                }
                if (inputEl === phoneInput) {
                    updatePhoneSuggestionUI(phoneInput.value.trim(), phoneSuggestionWrap, phoneSuggestionBtn);
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

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (isSubmittingFeedback) return;

            isSubmittingFeedback = true;
            ['username', 'email', 'phone', 'message', 'agreement'].forEach((id) => touchedFields.add(id));

            const isNameValid = validateName();
            const isEmailValid = validateEmail();
            const isPhoneValid = validatePhone();
            const isMessageValid = validateMessage();
            const isAgreementValid = validateAgreement();

            if (!isNameValid || !isEmailValid || !isPhoneValid || !isMessageValid || !isAgreementValid) {
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
                isSubmittingFeedback = false;
                return;
            }

            const selectedTopicOption = topicSelect.options[topicSelect.selectedIndex];
            const summaryRows = [
                ['Ім’я:', nameInput.value.trim().replace(/\s{2,}/g, ' ')],
                ['Email:', emailInput.value.trim()],
                ['Телефон:', phoneInput.value.trim()],
                ['Тема:', selectedTopicOption ? selectedTopicOption.text : 'Загальне звернення'],
            ];

            form.reset();
            resetFeedbackFormVisualState();

            openSuccessModal({
                title: 'Дякуємо за звернення!',
                description:
                    'Форма успішно пройшла клієнтську валідацію. Демонстрація успішного надсилання (імітація без підключення бекенд-сервера).',
                rows: summaryRows,
            });
            isSubmittingFeedback = false;
        });
    }

    // ========================================================
    // 6. КОНСТРУКТОР ТОРТА (#cakeBuilderForm) — ЗАПОБІГАННЯ HTTP 405 ТА ВАЛІДАЦІЯ
    // ========================================================

    if (cakeForm) {
        const cakeTextInput = document.getElementById('cake_text');
        const custNameInput = document.getElementById('cust_name');
        const custPhoneInput = document.getElementById('cust_phone');

        const cakeTextError = document.getElementById('cakeTextError');
        const custNameError = document.getElementById('custNameError');
        const custPhoneError = document.getElementById('custPhoneError');

        const custNameIcon = document.getElementById('custNameStatusIcon');
        const custPhoneIcon = document.getElementById('custPhoneStatusIcon');

        const custPhoneSuggestionWrap = document.getElementById('custPhoneSuggestionWrap');
        const custPhoneSuggestionBtn = document.getElementById('custPhoneSuggestionBtn');

        const BASE_LABELS = {
            vanilla: 'Ванільний бісквіт',
            chocolate: 'Шоколадний Callebaut',
            carrot: 'Морквяно-горіховий',
            'red-velvet': 'Червоний оксамит',
        };
        const CREAM_LABELS = {
            'mascarpone-berries': 'Маскарпоне & Ягоди',
            'salted-caramel': 'Карамель & Фундук',
            'pistachio-raspberry': 'Фісташка & Малина',
        };
        const WEIGHT_INFO = {
            '1.5kg': { label: '1.5 кг (Стандарт)', price: 1100 },
            '2.5kg': { label: '2.5 кг (Святковий)', price: 1750 },
            '4.0kg': { label: '4.0 кг (Банкетний)', price: 2800 },
        };
        const DECOR_INFO = {
            berries: { label: 'Свіжі ягоди', price: 180 },
            macarons: { label: 'Французькі макарони', price: 140 },
            gold: { label: 'Харчове золото', price: 90 },
            candles: { label: 'Святкові свічки', price: 50 },
        };

        function validateCakeText() {
            const val = cakeTextInput.value.trim();
            if (val.length === 0) {
                clearError(cakeTextInput, cakeTextError);
                return true;
            }
            if (REGEX_HTML_TAGS.test(val)) {
                showError(cakeTextInput, cakeTextError, 'Напис не може містити HTML-теги.');
                return false;
            }
            showSuccess(cakeTextInput, cakeTextError);
            return true;
        }

        function validateCustName() {
            return checkNameField(custNameInput, custNameError, custNameIcon);
        }

        function validateCustPhone() {
            return checkPhoneField(
                custPhoneInput,
                custPhoneError,
                custPhoneIcon,
                custPhoneSuggestionWrap,
                custPhoneSuggestionBtn
            );
        }

        custPhoneSuggestionBtn.addEventListener('click', () => {
            const suggested = custPhoneSuggestionBtn.dataset.suggestedPhone;
            if (suggested) {
                custPhoneInput.value = suggested;
                touchedFields.add('cust_phone');
                validateCustPhone();
                custPhoneInput.focus();
            }
        });

        custNameInput.addEventListener('blur', () => {
            touchedFields.add('cust_name');
            validateCustName();
        });
        custNameInput.addEventListener('input', () => {
            if (touchedFields.has('cust_name') || REGEX_NAME.test(custNameInput.value.trim())) {
                validateCustName();
            }
        });

        custPhoneInput.addEventListener('blur', () => {
            touchedFields.add('cust_phone');
            validateCustPhone();
        });
        custPhoneInput.addEventListener('input', () => {
            updatePhoneSuggestionUI(custPhoneInput.value.trim(), custPhoneSuggestionWrap, custPhoneSuggestionBtn);
            if (touchedFields.has('cust_phone') || REGEX_PHONE.test(custPhoneInput.value.trim())) {
                validateCustPhone();
            }
        });

        cakeTextInput.addEventListener('input', () => {
            if (cakeTextInput.value.trim().length > 0 || touchedFields.has('cake_text')) {
                validateCakeText();
            } else {
                clearError(cakeTextInput, cakeTextError);
            }
        });

        cakeForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Запобігаємо POST-запиту на статичний сервер (HTTP 405)
            ['cake_text', 'cust_name', 'cust_phone'].forEach((id) => touchedFields.add(id));

            const isTextValid = validateCakeText();
            const isNameValid = validateCustName();
            const isPhoneValid = validateCustPhone();

            if (!isTextValid || !isNameValid || !isPhoneValid) {
                const firstInvalid = [
                    [isTextValid, cakeTextInput],
                    [isNameValid, custNameInput],
                    [isPhoneValid, custPhoneInput],
                ].find(([valid]) => !valid);

                if (firstInvalid && firstInvalid[1]) {
                    firstInvalid[1].focus();
                }
                return;
            }

            const selectedBase = cakeForm.querySelector('input[name="cake_base"]:checked')?.value || 'vanilla';
            const selectedCream =
                cakeForm.querySelector('input[name="cake_cream"]:checked')?.value || 'mascarpone-berries';
            const selectedWeight = cakeForm.querySelector('input[name="cake_weight"]:checked')?.value || '1.5kg';
            const selectedDecors = Array.from(cakeForm.querySelectorAll('input[name="cake_decor"]:checked')).map(
                (el) => el.value
            );

            const weightObj = WEIGHT_INFO[selectedWeight] || WEIGHT_INFO['1.5kg'];
            let totalPrice = weightObj.price;
            const decorLabels = selectedDecors.map((key) => {
                const item = DECOR_INFO[key];
                if (item) {
                    totalPrice += item.price;
                    return item.label;
                }
                return key;
            });

            const inscription = cakeTextInput.value.trim();
            const summaryRows = [
                ['Замовник:', custNameInput.value.trim().replace(/\s{2,}/g, ' ')],
                ['Телефон:', custPhoneInput.value.trim()],
                [
                    'Основа та крем:',
                    `${BASE_LABELS[selectedBase] || selectedBase}, ${CREAM_LABELS[selectedCream] || selectedCream}`,
                ],
                ['Вага:', weightObj.label],
                ['Декор:', decorLabels.length > 0 ? decorLabels.join(', ') : 'Класичне оформлення без додатків'],
            ];
            if (inscription) {
                summaryRows.push(['Напис:', inscription]);
            }
            summaryRows.push(['Орієнтовна сума:', `${totalPrice.toLocaleString('uk-UA')} ₴`]);

            cakeForm.reset();
            clearError(cakeTextInput, cakeTextError);
            clearError(custNameInput, custNameError, custNameIcon);
            clearError(custPhoneInput, custPhoneError, custPhoneIcon);
            updatePhoneSuggestionUI('', custPhoneSuggestionWrap, custPhoneSuggestionBtn);
            ['cake_text', 'cust_name', 'cust_phone'].forEach((id) => touchedFields.delete(id));

            openSuccessModal({
                title: 'Замовлення торта прийнято!',
                description:
                    'Параметри вашого індивідуального торта успішно пройшли валідацію. Менеджер кондитерської зв’яжеться з вами протягом 15 хвилин.',
                rows: summaryRows,
            });
        });
    }

    // ========================================================
    // 7. ФОРМА ПІДПИСКИ У ПІДВАЛІ (#newsletterForm)
    // ========================================================

    if (newsletterForm) {
        const newsletterInput = document.getElementById('newsletter-email');
        const newsletterError = document.getElementById('newsletterError');

        newsletterInput.addEventListener('input', () => {
            if (!newsletterError.classList.contains('hidden')) {
                const val = newsletterInput.value.trim();
                if (REGEX_EMAIL.test(val)) {
                    newsletterInput.setAttribute('aria-invalid', 'false');
                    newsletterInput.classList.remove('border-red-400');
                    newsletterError.textContent = '';
                    newsletterError.classList.add('hidden');
                }
            }
        });

        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailVal = newsletterInput.value.trim();

            if (!REGEX_EMAIL.test(emailVal)) {
                newsletterInput.setAttribute('aria-invalid', 'true');
                newsletterInput.classList.add('border-red-400');
                newsletterError.textContent = 'Введіть коректну Email-адресу (наприклад: user@gmail.com).';
                newsletterError.classList.remove('hidden');
                newsletterInput.focus();
                return;
            }

            newsletterInput.setAttribute('aria-invalid', 'false');
            newsletterInput.classList.remove('border-red-400');
            newsletterError.textContent = '';
            newsletterError.classList.add('hidden');
            newsletterForm.reset();

            openSuccessModal({
                title: 'Дякуємо за підписку!',
                description:
                    'Вашу адресу успішно перевірено. Щотижневі спеціальні пропозиції Cafe Park Avenue надходитимуть на вказану пошту.',
                rows: [['Email підписника:', emailVal]],
            });
        });
    }
});
