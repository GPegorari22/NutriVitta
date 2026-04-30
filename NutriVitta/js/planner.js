const dropzones = document.querySelectorAll(".planner-dropzone");
const form = document.getElementById("planner-form");
const titleInput = document.getElementById("planner-title");
let cardCounter = 0;

const updatePlaceholder = (zone) => {
  const placeholder = zone.querySelector(".planner-placeholder");
  const cardsContainer = zone.querySelector(".planner-cards");

  if (!placeholder || !cardsContainer) return;

  placeholder.style.display = cardsContainer.children.length ? "none" : "block";
};

const addDragHandlers = (card) => {
  if (!card.id) {
    card.id = `planner-${Date.now()}-${cardCounter++}`;
  }
  card.setAttribute("draggable", "true");

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
  });

  card.addEventListener("dragend", (e) => {
    e.target.style.opacity = "1";
  });
};

const createDeleteButton = (card) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "planner-card__delete";
  button.textContent = "Excluir";
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    card.remove();
    dropzones.forEach(updatePlaceholder);
  });
  return button;
};

const decorateCard = (card) => {
  if (!card.querySelector(".planner-card__delete")) {
    const titleText = card.textContent.trim();
    card.textContent = "";

    const title = document.createElement("span");
    title.className = "planner-card__title";
    title.textContent = titleText;

    card.append(title, createDeleteButton(card));
  }

  addDragHandlers(card);
};

const createCard = (title) => {
  const card = document.createElement("div");
  card.className = "planner-card";
  card.id = `planner-${Date.now()}-${cardCounter++}`;
  card.draggable = true;

  const titleEl = document.createElement("span");
  titleEl.className = "planner-card__title";
  titleEl.textContent = title;

  card.append(titleEl, createDeleteButton(card));
  addDragHandlers(card);

  return card;
};

document.querySelectorAll(".planner-card").forEach(decorateCard);

dropzones.forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("is-dragover");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("is-dragover");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragover");

    const id = e.dataTransfer.getData("text/plain");
    const card = document.getElementById(id);
    const cardsContainer = zone.querySelector(".planner-cards");

    if (!card || !cardsContainer) return;

    cardsContainer.appendChild(card);

    if (zone.dataset.status === "done") {
      card.classList.add("planner-card--done");
    } else {
      card.classList.remove("planner-card--done");
    }

    dropzones.forEach(updatePlaceholder);
  });
});

dropzones.forEach(updatePlaceholder);

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;

    const targetZone = document.querySelector(
      '.planner-dropzone[data-status="backlog"]'
    );
    const cardsContainer = targetZone?.querySelector(".planner-cards");
    if (!cardsContainer) return;

    const newCard = createCard(title);
    cardsContainer.appendChild(newCard);
    dropzones.forEach(updatePlaceholder);

    form.reset();
    titleInput.focus();
  });
}


