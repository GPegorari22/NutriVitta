(() => {
    let modal = null;
    try {
        console.log('[calculadoras-modal] script carregado');
        modal = document.getElementById('calc-modal');
        if (!modal) {
            console.warn('[calculadoras-modal] elemento #calc-modal não encontrado — abortando inicialização');
            return;
        }

    const panel = modal.querySelector('.calc-modal__panel');
    const titleEl = document.getElementById('calc-modal-title');
    const descEl = document.getElementById('calc-step-description');
    const imageEl = document.getElementById('calc-step-image');
    const stepPanels = Array.from(modal.querySelectorAll('[data-step-panel]'));
    const stepIndicators = Array.from(modal.querySelectorAll('[data-step-indicator]'));
    const nextBtn = modal.querySelector('[data-calc-next]');
    const prevBtn = modal.querySelector('[data-calc-prev]');
    const closeButtons = modal.querySelectorAll('[data-calc-close]');
    const errorEl = document.getElementById('calc-form-error');
    const clientRadios = modal.querySelectorAll('input[name="calc-client"]');

    const resultValueEl = document.getElementById('calc-result-value');
    const resultLabelEl = document.getElementById('calc-result-label');
    const resultDetailEl = document.getElementById('calc-result-detail');
    const resultNoteEl = document.getElementById('calc-result-note');

    const menuSummaryEl = document.getElementById('calc-menu-summary');
    const menuContentEl = document.getElementById('calc-menu-content');
    const menuNoteEl = document.getElementById('calc-menu-note');

    let currentStep = 1;
    let currentCalc = 'imc';
    let clientType = 'adult';
    let lastFocus = null;
    let imcOmsData = null;
    let lastResult = null;

    const calcConfig = {
        imc: {
            title: 'Calculadora de IMC',
            description: 'O IMC (Índice de Massa Corporal) é uma forma simples de avaliar se o peso está adequado à altura. Ele ajuda a identificar possíveis riscos à saúde, mas não considera fatores como massa muscular, devendo ser usado apenas como referência inicial.',
            image: '../images/IMC.png',
            accent: '#0A4B3C',
            accentIntro: '#B85210',
            accentMain: '#0A4B3C'
        },
        tmb: {
            title: 'Calculadora de TMB',
            description: 'A Taxa de Metabolismo Basal indica a quantidade mínima de calorias que o corpo precisa em repouso para manter suas funções vitais.',
            image: '../images/TMB.png',
            accent: '#0A4B3C'
        },
        'peso-ideal': {
            title: 'Calculadora de Peso Ideal',
            description: 'O peso ideal é uma estimativa baseada na altura e sexo. Ele ajuda a definir metas realistas e saudáveis para o seu objetivo.',
            image: '../images/Peso-ideal.png',
            accent: '#0A4B3C'
        }
    };

    const formatNumber = (value, digits = 1) =>
        Number.isFinite(value) ? value.toLocaleString('pt-BR', { maximumFractionDigits: digits }) : '--';

    const formatDate = (value) => {
        if (!value) return '';
        const parts = value.split('-');
        if (parts.length !== 3) return value;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const getAgeFromBirth = (selector) => {
        const input = modal.querySelector(selector);
        if (!input || !input.value) return null;
        const birth = new Date(`${input.value}T00:00:00`);
        if (Number.isNaN(birth.getTime())) return null;
        const today = new Date();
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();
        if (days < 0) {
            months -= 1;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }
        if (years < 0) return null;
        return {
            years,
            months,
            yearsDecimal: years + months / 12
        };
    };

    const formatAgeLabel = (ageInfo) => {
        if (!ageInfo) return '';
        const { years, months } = ageInfo;
        if (years === 0 && months > 0) {
            return `${months} meses`;
        }
        if (months > 0) {
            return `${years} anos e ${months} meses`;
        }
        return `${years} anos`;
    };

    const getNumber = (selector) => {
        const input = modal.querySelector(selector);
        if (!input) return null;
        const value = parseFloat(String(input.value).replace(',', '.'));
        return Number.isFinite(value) ? value : null;
    };

    const normalizeHeight = (height) => {
        if (!Number.isFinite(height)) return null;
        return height < 3 ? height * 100 : height;
    };

    const getRadioValue = (name) => {
        const checked = modal.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : null;
    };

    const getSexLabel = (value) => {
        if (value === 'male') return 'Masculino';
        if (value === 'female') return 'Feminino';
        return '';
    };

    const showError = (message) => {
        if (!errorEl) return;
        errorEl.textContent = message || '';
    };

    const updateFormVisibility = () => {
        const forms = modal.querySelectorAll('[data-calc-form]');
        forms.forEach((form) => {
            const isActive = form.dataset.calcForm === currentCalc;
            form.classList.toggle('is-active', isActive);

            form.setAttribute('aria-hidden', String(!isActive));
        });

        const groups = modal.querySelectorAll('[data-client]');
        groups.forEach((group) => {
            const visible = group.dataset.client === clientType;

            if (visible) {
                group.removeAttribute('hidden');
                group.setAttribute('aria-hidden', 'false');
            } else {
                group.setAttribute('hidden', '');
                group.setAttribute('aria-hidden', 'true');
            }
        });
    };

    const getCurrentAccent = () => {
        const config = calcConfig[currentCalc];
        if (!config) return '#0A4B3C';

        if (clientType === 'child') {
            return 'var(--orange)';
        }
        if (currentCalc === 'imc' && config.accentIntro && config.accentMain) {
            return currentStep === 1 ? config.accentIntro : config.accentMain;
        }
        return config.accent;
    };

    const updateTheme = () => {
        const config = calcConfig[currentCalc];
        if (!config) return;
        titleEl.textContent = config.title;
        descEl.textContent = config.description;
        imageEl.src = config.image;
        imageEl.alt = config.title;
        panel.style.setProperty('--modal-accent', getCurrentAccent());
    };

    const updateSteps = () => {
        stepPanels.forEach((panelEl) => {
            const step = Number(panelEl.dataset.stepPanel);
            panelEl.classList.toggle('is-active', step === currentStep);
        });

        stepIndicators.forEach((indicator) => {
            const step = Number(indicator.dataset.stepIndicator);
            indicator.classList.toggle('is-active', step === currentStep);
            indicator.classList.toggle('is-complete', step < currentStep);
        });

        modal.dataset.step = String(currentStep);
        panel.style.setProperty('--modal-accent', getCurrentAccent());
        prevBtn.hidden = currentStep <= 2;
        nextBtn.hidden = currentStep === 4;

        if (currentStep === 1) {
            nextBtn.textContent = 'Continuar';
        } else if (currentStep === 2) {
            nextBtn.textContent = 'Enviar';
        } else if (currentStep === 3) {
            nextBtn.textContent = 'Ver plano';
        }
        nextBtn.classList.toggle('is-plan', currentStep === 3);
    };

    const setStep = (step) => {
        currentStep = step;
        updateSteps();
    };

    const openModal = (calcType) => {
        try {
            console.log('[calculadoras-modal] openModal chamado ->', calcType);
            if (!calcConfig[calcType]) {
                console.warn('[calculadoras-modal] calcType inválido:', calcType);
                return;
            }
            currentCalc = calcType;
            currentStep = 1;
            clientType = 'adult';
            const defaultClient = modal.querySelector('input[name="calc-client"][value="adult"]');
            if (defaultClient) defaultClient.checked = true;
            showError('');
            lastResult = null;
            resultValueEl.textContent = '--';
            resultLabelEl.textContent = 'Preencha o formulário para ver o resultado.';
            resultDetailEl.textContent = '';
            resultNoteEl.textContent = '';
            if (menuSummaryEl) menuSummaryEl.innerHTML = '';
            if (menuContentEl) menuContentEl.innerHTML = '';
            if (menuNoteEl) menuNoteEl.textContent = '';
            updateTheme();
            updateFormVisibility();
            updateSteps();
            const today = new Date().toISOString().slice(0, 10);
            modal.querySelectorAll('input[type="date"]').forEach((input) => {
                input.max = today;
            });

            lastFocus = document.activeElement;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            nextBtn.focus();
        } catch (err) {
            console.error('[calculadoras-modal] erro em openModal:', err);
        }
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    };

    const calcImcAdult = () => {
        const peso = getNumber('#imc-adult-peso');
        let altura = getNumber('#imc-adult-altura');
        if (!peso || !altura) return null;
        if (altura < 3) altura *= 100;
        const alturaM = altura / 100;
        return peso / (alturaM * alturaM);
    };

    const classifyImcAdult = (imc) => {
        const detail = 'Faixa saudável: 18,5 – 24,9';
        if (imc < 18.5) {
            return {
                status: 'Abaixo do peso',
                message: 'Seu peso está abaixo do ideal.',
                detail,
                plan: 'ganho'
            };
        }
        if (imc < 25) {
            return {
                status: 'Peso normal',
                message: 'Seu peso está dentro da faixa ideal.',
                detail,
                plan: 'manutencao'
            };
        }
        if (imc < 30) {
            return {
                status: 'Sobrepeso',
                message: 'Seu peso está acima do ideal.',
                detail,
                plan: 'perda'
            };
        }
        if (imc < 35) {
            return {
                status: 'Obesidade grau I',
                message: 'Seu peso indica obesidade (grau I).',
                detail,
                plan: 'perda'
            };
        }
        if (imc < 40) {
            return {
                status: 'Obesidade grau II',
                message: 'Seu peso indica obesidade (grau II).',
                detail,
                plan: 'perda'
            };
        }
        return {
            status: 'Obesidade grau III',
            message: 'Seu peso indica obesidade (grau III).',
            detail,
            plan: 'perda'
        };
    };

    const getOmsEntry = (years, sex) => {
        if (!imcOmsData || !Array.isArray(imcOmsData[sex]) || imcOmsData[sex].length === 0) return null;
        let closest = imcOmsData[sex][0];
        let minDiff = Math.abs(years - closest.years);
        imcOmsData[sex].forEach((row) => {
            const diff = Math.abs(years - row.years);
            if (diff < minDiff) {
                minDiff = diff;
                closest = row;
            }
        });
        return closest;
    };

    const calcImcChild = () => {
        const peso = getNumber('#imc-child-peso');
        let altura = getNumber('#imc-child-altura');
        if (!peso || !altura) return null;
        if (altura < 3) altura *= 100;
        const alturaM = altura / 100;
        return peso / (alturaM * alturaM);
    };

    const calcTmbAdult = () => {
        const sexo = getRadioValue('tmb-adult-sexo');
        const idade = getNumber('#tmb-adult-idade');
        const altura = getNumber('#tmb-adult-altura');
        const peso = getNumber('#tmb-adult-peso');
        if (!sexo || !idade || !altura || !peso) return null;
        if (sexo === 'male') {
            return 66.5 + 13.75 * peso + 5.003 * altura - 6.755 * idade;
        }
        return 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * idade;
    };

    const calcTmbChild = () => {
        const sexo = getRadioValue('tmb-child-sexo');
        const ageInfo = getAgeFromBirth('#tmb-child-nascimento');
        const idade = ageInfo ? ageInfo.yearsDecimal : null;
        const peso = getNumber('#tmb-child-peso');
        if (!sexo || !peso || idade === null) return null;
        if (idade < 3) return 58.317 * peso - 31.1;
        if (idade < 10) {
            return sexo === 'male'
                ? 22.7 * peso + 495 + 12.4 * idade - 266
                : 22.5 * peso + 499 + 5.9 * idade - 266;
        }
        if (idade < 18) {
            return sexo === 'male' ? 17.5 * peso + 651 : 12.2 * peso + 746;
        }
        return calcTmbAdult();
    };

    const calcPesoIdeal = (sexo, alturaCm) => {
        if (!sexo || !alturaCm) return null;
        const base = sexo === 'male' ? 50 : 45.5;
        return base + 0.91 * (alturaCm - 152.4);
    };

    const validateStep2 = () => {
        showError('');
        if (currentCalc === 'imc') {
            if (clientType === 'adult') {
                if (!getNumber('#imc-adult-idade') || !getNumber('#imc-adult-peso') || !getNumber('#imc-adult-altura') || !getRadioValue('imc-adult-sexo')) {
                    showError('Preencha idade, sexo, peso e altura para continuar.');
                    return false;
                }
                return true;
            }
            if (!modal.querySelector('#imc-child-nascimento').value || !getNumber('#imc-child-peso') || !getNumber('#imc-child-altura') || !getRadioValue('imc-child-sexo')) {
                showError('Preencha data de nascimento, peso, altura e sexo para continuar.');
                return false;
            }
            return true;
        }

        if (currentCalc === 'tmb') {
            if (clientType === 'adult') {
                if (!getRadioValue('tmb-adult-sexo') || !getNumber('#tmb-adult-idade') || !getNumber('#tmb-adult-altura') || !getNumber('#tmb-adult-peso')) {
                    showError('Preencha idade, sexo, peso e altura para continuar.');
                    return false;
                }
                return true;
            }
            if (!modal.querySelector('#tmb-child-nascimento').value || !getRadioValue('tmb-child-sexo') || !getNumber('#tmb-child-peso')) {
                showError('Preencha data de nascimento, peso e sexo para continuar.');
                return false;
            }
            return true;
        }

        if (currentCalc === 'peso-ideal') {
            if (clientType === 'adult') {
                if (!getRadioValue('peso-adult-sexo') || !getNumber('#peso-adult-altura')) {
                    showError('Preencha sexo e altura para continuar.');
                    return false;
                }
                return true;
            }
            if (!modal.querySelector('#peso-child-nascimento').value || !getRadioValue('peso-child-sexo') || !getNumber('#peso-child-altura')) {
                showError('Preencha data de nascimento, sexo e altura para continuar.');
                return false;
            }
            return true;
        }
        return true;
    };

    const buildMenu = (plan, isChild) => {
        const menu = [];
        const note = [];

        if (!isChild) {
            if (plan === 'ganho') {
                menu.push(
                    '<h4>Objetivo</h4><p>Aumentar o peso de forma saudável e gradual.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Refeições frequentes (3 principais + 2 a 3 lanches).</li><li>Alimentos energéticos e nutritivos.</li><li>Aumente gradualmente as porções.</li><li>Inclua proteínas magras e gorduras saudáveis.</li></ul>',
                    '<h4>Exemplo de cardápio</h4><ul><li><strong>Café da manhã:</strong> Aveia com leite integral, banana e nozes; omelete com vegetais.</li><li><strong>Lanche da manhã:</strong> Iogurte grego com granola e frutas.</li><li><strong>Almoço:</strong> Arroz integral, feijão, frango grelhado e salada variada.</li><li><strong>Lanche da tarde:</strong> Pasta de amendoim com torradas integrais.</li><li><strong>Jantar:</strong> Peixe assado com batata-doce e brócolis.</li><li><strong>Ceia:</strong> Iogurte natural com mel e amêndoas.</li></ul>'
                );
            }

            if (plan === 'manutencao') {
                menu.push(
                    '<h4>Objetivo</h4><p>Manter o peso e equilibrar a energia diária.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Monte pratos coloridos com frutas, verduras e proteínas magras.</li><li>Controle de porções e hidratação constante.</li><li>Inclua carboidratos integrais e gorduras boas.</li></ul>',
                    '<h4>Exemplo de cardápio</h4><ul><li><strong>Café da manhã:</strong> Pão integral com queijo branco e frutas.</li><li><strong>Lanche:</strong> Mix de castanhas.</li><li><strong>Almoço:</strong> Arroz integral, feijão, peixe grelhado e salada.</li><li><strong>Lanche:</strong> Iogurte com frutas.</li><li><strong>Jantar:</strong> Sopa de legumes com frango desfiado.</li></ul>'
                );
            }

            if (plan === 'perda') {
                menu.push(
                    '<h4>Objetivo</h4><p>Reduzir o peso com foco em leveza e saciedade.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Priorize vegetais, proteínas magras e fibras.</li><li>Evite ultraprocessados e bebidas açucaradas.</li><li>Faça refeições menores e mais frequentes.</li></ul>',
                    '<h4>Exemplo de cardápio</h4><ul><li><strong>Café da manhã:</strong> Omelete com legumes e chá.</li><li><strong>Lanche:</strong> Frutas com chia.</li><li><strong>Almoço:</strong> Prato com salada, frango grelhado e legumes cozidos.</li><li><strong>Lanche:</strong> Iogurte natural.</li><li><strong>Jantar:</strong> Sopa leve de legumes.</li></ul>'
                );
            }
        } else {
            note.push('Para crianças, evite restrições calóricas rigorosas e busque acompanhamento profissional.');
            if (plan === 'ganho') {
                menu.push(
                    '<h4>Objetivo</h4><p>Promover ganho de peso com equilíbrio nutricional.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Refeições pequenas e frequentes (5-6x/dia).</li><li>Priorize alimentos nutritivos, não apenas calóricos.</li><li>Inclua proteínas e carboidratos integrais.</li></ul>',
                    '<h4>Exemplo de cardápio infantil</h4><ul><li><strong>Café da manhã:</strong> Mingau de aveia com leite integral e banana.</li><li><strong>Lanche:</strong> Iogurte com mel e granola.</li><li><strong>Almoço:</strong> Arroz, feijão, frango desfiado e legumes.</li><li><strong>Lanche:</strong> Vitamina de leite, banana e aveia.</li><li><strong>Jantar:</strong> Macarrão integral com carne moída e legumes.</li><li><strong>Ceia:</strong> Leite morno com canela.</li></ul>'
                );
            }

            if (plan === 'manutencao') {
                menu.push(
                    '<h4>Objetivo</h4><p>Manter o crescimento saudável com alimentação equilibrada.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Prato colorido com frutas, verduras e proteínas.</li><li>Rotina de horários e hidratação.</li></ul>',
                    '<h4>Exemplo de cardápio infantil</h4><ul><li><strong>Café da manhã:</strong> Pão integral com queijo e fruta.</li><li><strong>Lanche:</strong> Mix de frutas.</li><li><strong>Almoço:</strong> Arroz, feijão, carne magra e salada.</li><li><strong>Lanche:</strong> Iogurte natural.</li><li><strong>Jantar:</strong> Sopa de legumes com frango.</li></ul>'
                );
            }

            if (plan === 'perda') {
                menu.push(
                    '<h4>Objetivo</h4><p>Reduzir o excesso de peso com cuidado e supervisão.</p>',
                    '<h4>Princípios gerais</h4><ul><li>Priorize alimentos naturais e reduza ultraprocessados.</li><li>Evite dietas restritivas sem orientação.</li></ul>',
                    '<h4>Exemplo de cardápio infantil</h4><ul><li><strong>Café da manhã:</strong> Frutas com iogurte.</li><li><strong>Lanche:</strong> Fruta fresca.</li><li><strong>Almoço:</strong> Prato com legumes, frango e arroz integral.</li><li><strong>Lanche:</strong> Castanhas.</li><li><strong>Jantar:</strong> Sopa leve.</li></ul>'
                );
            }
        }

        return {
            html: menu.join(''),
            note: note.join(' ')
        };
    };

    const renderResult = (result) => {
        resultValueEl.textContent = result.value;
        resultLabelEl.textContent = result.label;
        resultDetailEl.textContent = result.detail || '';

        const parts = [];
        if (result.note) parts.push(result.note);
        if (result.status) parts.push(`<strong>Classificação:</strong> ${result.status}`);
        if (result.plan) parts.push(`<strong>Plano:</strong> ${result.plan}`);
        resultNoteEl.innerHTML = parts.join(' — ');
    };

    const renderMenu = (summaryHtml, menuHtml, menuNote) => {
        menuSummaryEl.innerHTML = summaryHtml;
        menuContentEl.innerHTML = menuHtml;
        menuNoteEl.textContent = menuNote || '';

    };

    const buildSummaryList = (items) => {
        const list = items.filter(Boolean).map((item) => `<li>${item}</li>`).join('');
        return `<ul>${list}</ul>`;
    };

    const buildSummary = (result) => {
        if (!result) return '';
        const parts = [];
        if (result.detail) parts.push(result.detail);
        if (result.note) parts.push(result.note);
        if (result.status) parts.push(`<strong>Classificação:</strong> ${result.status}`);
        if (result.plan) parts.push(`<strong>Plano:</strong> ${result.plan}`);
        return parts.length ? `<div class="calc-summary">${parts.map(p => `<p>${p}</p>`).join('')}</div>` : '';
    };

    const computeResults = () => {
        if (currentCalc === 'imc') {
            if (clientType === 'adult') {
                const imc = calcImcAdult();
                if (!imc) return null;
                const cls = classifyImcAdult(imc);
                return {
                    value: formatNumber(imc),
                    label: cls.message,
                    detail: cls.detail,
                    note: 'O IMC é apenas uma estimativa e não substitui avaliação profissional.',
                    plan: cls.plan,
                    status: cls.status
                };
            }
            const imc = calcImcChild();
            if (!imc) return null;
            const ageInfo = getAgeFromBirth('#imc-child-nascimento');
            const idade = ageInfo ? ageInfo.yearsDecimal : null;
            const sexo = getRadioValue('imc-child-sexo');
            if (idade === null) return null;
            const entry = getOmsEntry(idade, sexo);
            if (!entry) {
                return {
                    value: formatNumber(imc),
                    label: 'IMC infantil calculado',
                    detail: 'Tabela OMS pendente.',
                    note: 'Compare este valor com as curvas OMS para idade e sexo.',
                    plan: 'manutencao',
                    status: 'IMC infantil'
                };
            }

            let status = 'Normal';
            let message = 'Seu peso está dentro da faixa ideal.';
            let plan = 'manutencao';

            if (imc >= entry.obesityMin) {
                status = 'Obesidade';
                message = 'Seu peso indica obesidade.';
                plan = 'perda';
            } else if (imc > entry.normalMax) {
                status = 'Sobrepeso';
                message = 'Seu peso está acima do ideal.';
                plan = 'perda';
            }
            const percentil = status === 'Normal' ? '3 a 85' : status === 'Sobrepeso' ? '85 a 97' : 'acima de 97';
            const omsDetail = `Referência OMS: Normal até ${entry.normalMax} | Sobrepeso acima de ${entry.overMin} | Obesidade acima de ${entry.obesityMin}`;
            return {
                value: formatNumber(imc),
                label: message,
                detail: `Classificação: ${status} | Percentil estimado: ${percentil}`,
                note: `${omsDetail}. Interprete sempre com acompanhamento pediátrico.`,
                plan,
                status
            };
        }

        if (currentCalc === 'tmb') {
            const tmb = clientType === 'adult' ? calcTmbAdult() : calcTmbChild();
            if (!tmb) return null;
            return {
                value: `${formatNumber(tmb, 0)} kcal/dia`,
                label: 'Taxa de metabolismo basal estimada',
                detail: 'Use este valor para ajustar suas metas diárias.',
                note: clientType === 'child' ? 'Valores pediátricos são estimativas e exigem orientação.' : '',
                plan: 'manutencao'
            };
        }

        if (currentCalc === 'peso-ideal') {
            const sexo = clientType === 'adult' ? getRadioValue('peso-adult-sexo') : getRadioValue('peso-child-sexo');
            let altura = clientType === 'adult' ? getNumber('#peso-adult-altura') : getNumber('#peso-child-altura');
            if (altura && altura < 3) altura *= 100;
            const ideal = calcPesoIdeal(sexo, altura);
            if (!ideal) return null;
            const faixaMin = Math.max(0, ideal - 2);
            const faixaMax = ideal + 2;
            return {
                value: `${formatNumber(ideal)} kg`,
                label: 'Peso ideal estimado',
                detail: `Faixa estimada: ${formatNumber(faixaMin)} – ${formatNumber(faixaMax)} kg`,
                note: '',
                plan: 'manutencao'
            };
        }

        return null;
    };

    const updateResultAndMenu = () => {
        const result = computeResults();
        if (!result) {

            if (menuSummaryEl) menuSummaryEl.innerHTML = '';
            if (menuContentEl) menuContentEl.innerHTML = '';
            if (menuNoteEl) menuNoteEl.textContent = '';
            showError('Não foi possível calcular o resultado. Verifique os campos e tente novamente.');
            console.warn('computeResults retornou null — campos incompletos ou inválidos');
            return false;
        }
        lastResult = result;
        renderResult(result);

        const isChild = clientType === 'child';

        let menuPlan = result.plan;




        if (result.status) {
            const s = String(result.status).toLowerCase();
            if (s.includes('abaixo')) {
                menuPlan = 'ganho';
            } else if (s.includes('peso normal') || s === 'normal' || s.includes('peso normal')) {
                menuPlan = 'manutencao';
            } else if (s.includes('sobrepeso') || s.includes('obesidade')) {
                menuPlan = 'perda';
            }
            console.log('Plano escolhido a partir do status:', result.status, '->', menuPlan);
        }
        const menu = buildMenu(menuPlan, isChild);
        const summaryHtml = buildSummary(result);
        const combinedNote = [result.note, menu.note].filter(Boolean).join(' ');
        renderMenu(summaryHtml, menu.html, combinedNote);
        console.log('Resultado calculado:', result);

        return true;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            const selected = modal.querySelector('input[name="calc-client"]:checked');
            clientType = selected ? selected.value : 'adult';
            updateFormVisibility();
            setStep(2);
            return;
        }

        if (currentStep === 2) {
            if (!validateStep2()) return;
            if (!updateResultAndMenu()) return;
            setStep(3);
            return;
        }

        if (currentStep === 3) {
            setStep(4);
        }
    };

    const handlePrev = () => {
        if (currentStep === 4) {
            setStep(3);
            return;
        }
        if (currentStep === 3) {
            setStep(2);
            return;
        }
        if (currentStep === 2) {
            setStep(1);
        }
    };

    clientRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            clientType = radio.value;
            updateFormVisibility();
            updateTheme();
        });
    });

    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);

    closeButtons.forEach((btn) => {
        btn.addEventListener('click', closeModal);
    });

    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    const cards = document.querySelectorAll('.calc-card');
    console.log('[calculadoras-modal] encontradas', cards.length, 'calc-card(s)');
    cards.forEach((card, idx) => {
        try {
            const calcType = card.dataset.card;
            const btn = card.querySelector('.calc-btn');
            if (btn) {
                btn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('[calculadoras-modal] click em botão CALCULAR (card', idx, ') ->', calcType);
                    openModal(calcType);
                });
            }
            card.addEventListener('click', (event) => {
                if (event.target.closest('.calc-btn')) return;
                console.log('[calculadoras-modal] click em card (card', idx, ') ->', calcType);
                openModal(calcType);
            });
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    console.log('[calculadoras-modal] key activate (card', idx, ') ->', calcType);
                    openModal(calcType);
                }
            });
        } catch (e) {
            console.error('[calculadoras-modal] erro ao adicionar listeners ao card', idx, e);
        }
    });

    window.addEventListener('clientSelected', (e) => {
        try {
            const c = e.detail;
            if (!c) return;

            const set = (sel, val) => {
                const el = modal.querySelector(sel);
                if (!el) return;
                el.value = val === null || typeof val === 'undefined' ? '' : String(val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            };
            const setRadio = (name, val) => {
                if (!val) return;
                const r = modal.querySelector(`input[name="${name}"][value="${val}"]`);
                if (r) r.checked = true;
            };

            set('#imc-adult-peso', c.weight);
            set('#imc-child-peso', c.weight);
            set('#tmb-adult-peso', c.weight);
            set('#tmb-child-peso', c.weight);

            set('#imc-adult-altura', c.height);
            set('#imc-child-altura', c.height);
            set('#tmb-adult-altura', c.height);
            set('#peso-adult-altura', c.height);
            set('#peso-child-altura', c.height);

            set('#imc-child-nascimento', c.dob);
            set('#tmb-child-nascimento', c.dob);
            set('#peso-child-nascimento', c.dob);

            setRadio('imc-adult-sexo', c.sex);
            setRadio('imc-child-sexo', c.sex);
            setRadio('tmb-adult-sexo', c.sex);
            setRadio('tmb-child-sexo', c.sex);
            setRadio('peso-adult-sexo', c.sex);
            setRadio('peso-child-sexo', c.sex);

            if (c.type) {
                const sel = modal.querySelector(`input[name="calc-client"][value="${c.type}"]`);
                if (sel) {
                    sel.checked = true;
                    clientType = c.type;
                    updateFormVisibility();
                }
            }

            if (c.dob) {
                const b = new Date(c.dob + 'T00:00:00');
                if (!Number.isNaN(b.getTime())) {
                    const today = new Date();
                    let age = today.getFullYear() - b.getFullYear();
                    const m = today.getMonth() - b.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
                    if (age >= 0) {
                        set('#imc-adult-idade', age);
                        set('#tmb-adult-idade', age);
                    }
                }
            }

            if (modal.classList.contains('is-open') && currentStep >= 2) {
                try { updateResultAndMenu(); } catch (err) {  }
            }
        } catch (err) {
            console.warn('[calculadoras-modal] clientSelected handler error', err);
        }
    });

    } catch (e) {
        console.error('[calculadoras-modal] erro na inicialização:', e);
    }

    fetch('../data/imc-oms.json')
        .then((response) => response.json())
        .then((data) => {
            if (data && data.source) {
                imcOmsData = data;
            }
        })
        .catch(() => {
            imcOmsData = null;
        });

    const transformRadiosToToggles = () => {
        console.log('[calculadoras-modal] transformRadiosToToggles iniciando');
        const radioLabels = Array.from(modal.querySelectorAll('label')).filter(l => l.querySelector('input[type="radio"]'));
        console.log('[calculadoras-modal] labels com radios encontrados:', radioLabels.length);
        const groups = {};
        radioLabels.forEach((label) => {
            const input = label.querySelector('input[type="radio"]');
            if (!input) return;
            const name = input.name || '__noname__';
            if (!groups[name]) groups[name] = [];
            groups[name].push({ input, label });
        });

        console.log('[calculadoras-modal] grupos identificados:', Object.keys(groups));

        let hiddenContainer = modal.querySelector('.calc-hidden-inputs');
        if (!hiddenContainer) {
            hiddenContainer = document.createElement('div');
            hiddenContainer.className = 'calc-hidden-inputs';
            hiddenContainer.style.display = 'none';
            modal.appendChild(hiddenContainer);
        }

        Object.keys(groups).forEach((name) => {
            const items = groups[name];
            console.log('[calculadoras-modal] criando toggle group', name, 'com', items.length, 'itens');

            const wrapper = document.createElement('div');
            wrapper.className = 'calc-toggle';

            const firstLabel = items[0].label;
            if (firstLabel && firstLabel.parentNode) {
                firstLabel.parentNode.insertBefore(wrapper, firstLabel);
                console.log('[calculadoras-modal] wrapper inserido antes do primeiro label para grupo', name);
            } else {
                modal.appendChild(wrapper);
                console.warn('[calculadoras-modal] primeiro label não tem parentNode; appended wrapper to modal for group', name);
            }
            firstLabel.parentNode.insertBefore(wrapper, firstLabel);

            items.forEach(({ input, label }) => {
                const value = input.value;
                const text = label.textContent.trim();

                if (input && input.parentNode && input.parentNode !== hiddenContainer) {
                    hiddenContainer.appendChild(input);
                }

                if (label && label.parentNode) label.parentNode.removeChild(label);

                input.classList.add('visually-hidden');
                input.setAttribute('aria-hidden', 'true');

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'calc-toggle-btn';
                btn.dataset.name = name;
                btn.dataset.value = value;
                btn.setAttribute('role', 'radio');
                btn.setAttribute('aria-checked', input.checked ? 'true' : 'false');
                btn.innerHTML = `<span class="toggle-circle" aria-hidden="true"></span><span class="toggle-text">${text}</span>`;
                if (input.checked) btn.classList.add('is-selected');

                btn.addEventListener('click', () => {

                    Array.from(wrapper.querySelectorAll('.calc-toggle-btn')).forEach((b) => {
                        b.classList.remove('is-selected');
                        b.setAttribute('aria-checked', 'false');
                    });
                    btn.classList.add('is-selected');
                    btn.setAttribute('aria-checked', 'true');

                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });

                wrapper.appendChild(btn);
            });
        });
    };

    transformRadiosToToggles();

    if (menuContentEl) {
        menuContentEl.addEventListener('click', (event) => {
            const li = event.target.closest('li');
            if (!li || !menuContentEl.contains(li)) return;
            const raw = li.textContent || li.innerText || '';
            const text = raw.replace(/\s+/g, ' ').trim();
            if (!text) return;
            const query = encodeURIComponent(text + ' receita');
            const url = `https://www.google.com/search?q=${query}`;

            window.open(url, '_blank');
        });
    }
})();




