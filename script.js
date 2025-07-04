"use strict";

//DOM SELECTION

// The form and input fields
const form = document.querySelector("form");
const titleInput = document.getElementById("title-input");
const descInput = document.getElementById("desc-input");
const titleCount = document.getElementById("title-count");

// Title char countdown
const titleLimit = 40;

titleInput.addEventListener("focus", () => {
  titleCount.style.display = "inline";
  updateTitleCount();
});

titleInput.addEventListener("blur", () => {
  titleCount.style.display = "none";
});

titleInput.addEventListener("input", updateTitleCount);

function updateTitleCount() {
  const used = titleInput.value.length;
  titleCount.textContent = `${used} / ${titleLimit}`;
}

// Execution date
const execInput = document.getElementById("execution-date");

// Task list and empty-message element
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const deleteAllBtn = document.getElementById("delete-all-btn");

deleteAllBtn.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to delete all tasks?");
  if (confirmed) {
    tasks = []; // clear the array
    updateLocalStorage(); // clear it in localStorage too
    renderTasks(); // refresh the UI
  }
});

// Detail panel and its inner elements
const detailPanel = document.querySelector(".detail-panel");
const closeDetailBtn = document.querySelector(".close-detail-panel");
const detailTitle = document.querySelector(".detail-title");
const detailDesc = document.querySelector(".detail-description");
const detailExecDate = document.querySelector(".detail-execution-date");

// Title char limit
const maxTitleLength = 40;

detailTitle.addEventListener("input", () => {
  let txt = detailTitle.textContent;
  if (txt.length > maxTitleLength) {
    detailTitle.textContent = txt.slice(0, maxTitleLength);

    // reset the cursor to the end
    const range = document.createRange();
    range.selectNodeContents(detailTitle);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();

    sel.addRange(range);
  }
});

// Execution date - Flatpickr
document.addEventListener("DOMContentLoaded", function () {
  const execDateInput = document.getElementById("execution-date");
  flatpickr(execDateInput, {
    allowInput: true,
    dateFormat: "Y-m-d",
    clickOpens: true,
  });
});

// Buttons inside the detail panel used for editing and deletion
const panelEditBtn = document.querySelector(".edit-btn");
const panelDeleteBtn = document.querySelector(".delete-btn");

//GLOBAL DATA STRUCTURES

// Array to store task objects
let tasks = [];

// variable to hold the id of the task currently shown in the detail panel
let currentTaskId = null;

// LocalStorage functions
function updateLocalStorage() {
  const tasksString = JSON.stringify(tasks);
  localStorage.setItem("tasks", tasksString);
}

function loadTasksFromLocalStorage() {
  const storedTasks = localStorage.getItem("tasks");
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    tasks = [];
  }
}

//DUe date countdown
function getCountdownLabel(execStr) {
  if (!execStr) return "";

  const today = new Date(); // today
  today.setHours(0, 0, 0, 0);
  const due = new Date(execStr); // task's execution date
  due.setHours(0, 0, 0, 0);
  const diff = due - today; // difference in milliseconds
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); // convert to full days (this is number of milliseconds in one full day)

  if (isNaN(days)) return "";
  if (days > 1) return `${days} days remaining`;
  if (days === 1) return "1 day remaining";
  if (days === 0) return "Due today";
  return "Overdue";
}

// UI Rendering functions
function renderTasks() {
  taskList.innerHTML = "";

  // Toggle the empty-message and delete-all button display
  if (tasks.length === 0) {
    emptyMessage.style.display = "block";
    deleteAllBtn.style.display = "none";
  } else {
    emptyMessage.style.display = "none";
    deleteAllBtn.style.display = "block";
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.classList.add("task");
    const countdown = getCountdownLabel(task.executionDate);
    li.textContent = `${task.title} (${task.timestamp}) • ${countdown}`;

    // Icons container
    const iconsContainer = document.createElement("div");
    iconsContainer.classList.add("icons");

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "✎";
    //Stop this click from bubbling up to the li // prompt the user to edit just the title
    editBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // prevents li’s click handler - callback function - don't send this click event on parent elements
      const newTitle = prompt("Edit task title:", task.title);
      if (newTitle !== null) {
        task.title = newTitle.trim();
        task.timestamp = new Date().toLocaleString("en-IN", {
          dateStyle: "short",
          timeStyle: "short",
        });
        updateLocalStorage();
        renderTasks();
      }
    });
    iconsContainer.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✖";
    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter((t) => t.id !== task.id); // arrow function with filter -arrow method
        updateLocalStorage();
        renderTasks();
      }
    });
    iconsContainer.appendChild(deleteBtn);

    li.appendChild(iconsContainer);

    // click on the "li" itself still opens the detail panel
    li.addEventListener("click", function () {
      showDetailPanel(task);
    });

    taskList.appendChild(li);
  });
}

function formattedTimestamp() {
  const now = new Date(); // captures the current date and time

  const year = now.getFullYear(); // e.g., 2025
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 0-indexed, so Jan = 0, add 1
  const day = String(now.getDate()).padStart(2, "0"); // 1–31, pad with 0 if needed

  const hours = String(now.getHours()).padStart(2, "0"); // 0–23
  const minutes = String(now.getMinutes()).padStart(2, "0"); // 0–59
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Form submission handler
function handleTaskSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (title === "" || description === "") {
    // checking if empty
    alert("Please enter title and description.");
    return;
  }

  const newTask = {
    id: Date.now(),
    title: title,
    description: description,
    executionDate: execInput.value, // due date in format "2025-06-23"
    timestamp: formattedTimestamp(),
  };

  tasks.push(newTask);
  updateLocalStorage();
  renderTasks();
  form.reset();
}

// Detail Panel functions

function showDetailPanel(task) {
  currentTaskId = task.id; // remember the currently selected task
  detailTitle.textContent = task.title;
  detailDesc.textContent = task.description;
  detailExecDate.textContent = task.executionDate
    ? `Due date: ${task.executionDate} (${getCountdownLabel(task.executionDate)})`
    : "Execution date set is not set";

  // Ensure the detail text is not editable by default
  detailTitle.contentEditable = false;
  detailDesc.contentEditable = false;

  // Reset the edit button text in case it was changed before
  panelEditBtn.textContent = "Edit";

  // Show the detail panel
  detailPanel.classList.remove("hidden");
}

// Edit functionality

// When the edit button is clicked in the detail panel, toggle between edit ands ave
panelEditBtn.addEventListener("click", function () {
  if (panelEditBtn.textContent === "Edit") {
    // Switch to edit mode by making fields editable
    detailTitle.contentEditable = true;
    detailDesc.contentEditable = true;
    // Create and insert date input when editing
    const currentDate = tasks.find((t) => t.id === currentTaskId)?.executionDate || "";
    const execInputField = document.createElement("input");
    execInputField.type = "date";
    execInputField.id = "edit-exec-date";
    execInputField.value = currentDate;
    detailExecDate.innerHTML = ""; // clears current text

    detailExecDate.appendChild(execInputField);

    // Change button text to "Save"
    panelEditBtn.textContent = "Save";
  } else {
    // Save mode: retrieve updated values
    let newTitle = detailTitle.textContent.trim();
    let newDesc = detailDesc.textContent.trim();
    const execInputField = document.getElementById("edit-exec-date");
    const newDate = execInputField?.value || "";

    // to find the task by looping through the tasks array
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === currentTaskId) {
        tasks[i].title = newTitle;
        tasks[i].description = newDesc;
        tasks[i].executionDate = newDate;
        tasks[i].timestamp = formattedTimestamp();
        break;
      }
    }
    updateLocalStorage();
    renderTasks();
    // Re-display the updated task data in the detail panel
    const updatedTask = tasks.find(function (task) {
      return task.id === currentTaskId;
    });

    detailExecDate.textContent = newDate
      ? `Due: ${newDate} (${getCountdownLabel(newDate)})`
      : "No execution date set";

    showDetailPanel(updatedTask);
  }
});

// Delete Functionality (detail panel)

panelDeleteBtn.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to delete this task?");
  if (confirmed) {
    // Remove the task with the currentTaskId
    tasks = tasks.filter(function (task) {
      return task.id !== currentTaskId;
    });
    updateLocalStorage();
    renderTasks();
    // Hide the detail panel after deletion
    detailPanel.classList.add("hidden");
  }
});

// Close Detail panel
closeDetailBtn.addEventListener("click", function () {
  detailPanel.classList.add("hidden");
});

// Initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  loadTasksFromLocalStorage();
  renderTasks();
  form.addEventListener("submit", handleTaskSubmit);
  console.log("Tasks loaded from localStorage:", tasks);
});
