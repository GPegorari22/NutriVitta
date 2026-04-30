(() => {
    const STORAGE_KEY = 'nutrivitta_clients';

    const modal = document.createElement('div');
    modal.className = 'client-modal';
    modal.id = 'client-modal';

    modal.innerHTML = `
    <div class="client-modal__backdrop" data-client-close></div>
    <div class="client-modal__panel" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
      <div class="client-modal__header">
        <div>
          <h2 id="client-modal-title">Cadastro de Cliente</h2>
          <p class="client-modal__subtitle">Preencha os dados para usar nas calculadoras</p>
        </div>
        <button class="client-modal__close" type="button" data-client-close aria-label="Fechar">&times;</button>
      </div>
      <div class="client-modal__body">
        <form id="client-form" autocomplete="on">
          <label>Nome
            <input placeholder="Ex.: Maria Silva" type="text" id="client-name" required autocomplete="name">
          </label>
          <label>Contato (email/telefone)
            <input placeholder="email@exemplo.com ou (16) 9 9999-9999" type="text" id="client-contact" autocomplete="email">
          </label>
          <div class="client-type">
            <label class="inline"><input type="radio" name="client-type" value="adult" checked> Adulto</label>
            <label class="inline"><input type="radio" name="client-type" value="child"> Criança</label>
          </div>
          <div class="client-basic">
            <div class="client-sex">
              <label class="inline"><input type="radio" name="client-sex" value="male"> Masculino</label>
              <label class="inline"><input type="radio" name="client-sex" value="female"> Feminino</label>
            </div>
            <div class="two-cols">
              <label>Peso (kg)<input type="number" id="client-weight" step="0.1" inputmode="decimal" placeholder="kg"></label>
              <label>Altura (cm)<input type="number" id="client-height" step="0.1" inputmode="decimal" placeholder="cm"></label>
            </div>
          </div>
          <div class="client-child-fields" hidden>
            <label>Data de nascimento<input type="date" id="client-dob"></label>
            <label>Altura pai (cm)<input type="number" id="client-height-father"></label>
            <label>Altura mãe (cm)<input type="number" id="client-height-mother"></label>
            <label>Fase escolar
              <select id="client-school">
                <option value="creche">Creche</option>
                <option value="pre">Pré-escola</option>
                <option value="fund">Ensino fundamental</option>
              </select>
            </label>
            <label>Histórico de crescimento<textarea id="client-history" placeholder="Observações sobre crescimento e saúde"></textarea></label>
          </div>
          <fieldset>
            <legend>Hábitos</legend>
            <label class="habit-row"><input type="checkbox" id="habito-tabaco"> Fumante</label>
            <label class="habit-row"><input type="checkbox" id="habito-alcool"> Consumo de álcool</label>
            <label class="habit-row"><input type="checkbox" id="habito-drogas"> Uso de drogas</label>
          </fieldset>
          <div class="client-actions">
            <button type="submit" id="client-save">Salvar cliente</button>
            <button type="button" id="client-clear">Limpar</button>
          </div>
        </form>
        <aside class="client-aside">
          <h3>Dica rápida</h3>
          <p>Ao salvar, os dados preencherão automaticamente os formulários das calculadoras (IMC, TMB e Peso Ideal).</p>
        </aside>
      </div>
    </div>
    `;

    document.body.appendChild(modal);

    const openBtn = document.getElementById('open-client-modal');
    const panel = modal.querySelector('.client-modal__panel');
    const closeEls = modal.querySelectorAll('[data-client-close]');
    const form = document.getElementById('client-form');

    function loadClients() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) { return []; }
    }

    function saveClients(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

    function openModal() {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        const first = modal.querySelector('input[type="text"]');
        if (first && typeof first.focus === 'function') first.focus();
    }
    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    openBtn && openBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    closeEls.forEach((el) => el.addEventListener('click', closeModal));

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelectorAll('input[name="client-type"]').forEach((r) => {
        r.addEventListener('change', () => {
            const val = modal.querySelector('input[name="client-type"]:checked').value;
            const childFields = modal.querySelector('.client-child-fields');
            if (val === 'child') childFields.hidden = false; else childFields.hidden = true;
        });
    });

    const clearBtn = modal.querySelector('#client-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        modal.querySelectorAll('input, textarea, select').forEach((el) => {
            if (el.type === 'radio' || el.type === 'checkbox') {
                if (el.defaultChecked) el.checked = true; else el.checked = false;
            } else {
                el.value = '';
            }
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = {
            name: document.getElementById('client-name').value.trim(),
            contact: document.getElementById('client-contact').value.trim(),
            type: document.querySelector('input[name="client-type"]:checked').value,
            sex: document.querySelector('input[name="client-sex"]:checked') ? document.querySelector('input[name="client-sex"]:checked').value : null,
            weight: parseFloat(document.getElementById('client-weight').value) || null,
            height: parseFloat(document.getElementById('client-height').value) || null,
            dob: document.getElementById('client-dob').value || null,
            heightFather: parseFloat(document.getElementById('client-height-father').value) || null,
            heightMother: parseFloat(document.getElementById('client-height-mother').value) || null,
            school: document.getElementById('client-school').value || null,
            history: document.getElementById('client-history').value || '',
            habits: {
                smoke: !!document.getElementById('habito-tabaco').checked,
                alcohol: !!document.getElementById('habito-alcool').checked,
                drugs: !!document.getElementById('habito-drogas').checked
            },
            createdAt: new Date().toISOString()
        };
        const arr = loadClients();
        arr.push(client);
        saveClients(arr);
        try {
            window.dispatchEvent(new CustomEvent('clientSelected', { detail: client }));
        } catch (err) {
            console.warn('Erro ao disparar evento clientSelected', err);
        }
        closeModal();
    });

    window._nutrivittaClients = { load: loadClients, save: saveClients };
})();


