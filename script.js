// Abstract class for TodoItemFormatter
class TodoItemFormatter {
  formatTask(task) {
    return task.length > 30 ? task.slice(0, 30) + "..." : task;
  }

  formatDueDate(dueDate) {
    return dueDate || "No due date";
  }

  formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + " Priority";
  }

  formatStatus(completed) {
    return completed ? "Completed" : "Pending";
  }
}

// Class responsible for managing Todo items
class TodoManager {
  constructor(todoItemFormatter) {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.todoItemFormatter = todoItemFormatter;
  }

  addTodo(task, dueDate, priority) {
    const newTodo = {
      id: this.getRandomId(),
      task: this.todoItemFormatter.formatTask(task),
      dueDate: this.todoItemFormatter.formatDueDate(dueDate),
      priority: priority || "low",
      completed: false,
      status: "pending",
    };
    this.todos.push(newTodo);
    this.saveToLocalStorage();
    return newTodo;
  }

  editTodo(id, updatedTask, updatedPriority) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.task = this.todoItemFormatter.formatTask(updatedTask);
      todo.priority = updatedPriority || todo.priority;
      this.saveToLocalStorage();
    }
    return todo;
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveToLocalStorage();
  }

  toggleTodoStatus(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveToLocalStorage();
    }
  }

  clearAllTodos() {
    if (this.todos.length > 0) {
      this.todos = [];
      this.saveToLocalStorage();
    }
  }

  filterTodos(status) {
    switch (status) {
      case "all":
        return this.todos;
      case "pending":
        return this.todos.filter((todo) => !todo.completed);
      case "completed":
        return this.todos.filter((todo) => todo.completed);
      default:
        return [];
    }
  }

  getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  saveToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }
}

// Class responsible for managing the UI and handling events
class UIManager {
  constructor(todoManager, todoItemFormatter) {
    this.todoManager = todoManager;
    this.todoItemFormatter = todoItemFormatter;
    this.taskInput = document.querySelector(".task-input");
    this.dateInput = document.querySelector(".schedule-date");
    this.prioritySelect = document.querySelector(".priority-select");
    this.addBtn = document.querySelector(".add-task-button");
    this.todosListBody = document.querySelector(".todos-list-body");
    this.alertMessage = document.querySelector(".alert-message");
    this.deleteAllBtn = document.querySelector(".delete-all-btn");
    this.themeSwitcherBtn = document.querySelector(".theme-switcher-btn");

    this.addEventListeners();
    this.showAllTodos();
    this.initDragAndDrop();
    this.handleThemeSwitching();
  }

  addEventListeners() {
    // Event listener for adding a new todo
    this.addBtn.addEventListener("click", () => {
      this.handleAddTodo();
    });

    // Event listener for pressing Enter key in the task input
    this.taskInput.addEventListener("keyup", (e) => {
      if (e.keyCode === 13 && this.taskInput.value.length > 0) {
        this.handleAddTodo();
      }
    });

    // Event listener for deleting all todos
    this.deleteAllBtn.addEventListener("click", () => {
      this.handleClearAllTodos();
    });

    // Event listeners for filter buttons
    const filterButtons = document.querySelectorAll(".todos-filter li");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const status = button.textContent.toLowerCase();
        this.handleFilterTodos(status);
      });
    });
  }

  handleAddTodo() {
    const task = this.taskInput.value;
    const dueDate = this.dateInput.value;
    const priority = this.prioritySelect.value;
    if (task === "") {
      this.showAlertMessage("Please enter a task", "error");
    } else {
      const newTodo = this.todoManager.addTodo(task, dueDate, priority);
      this.showAllTodos();
      this.taskInput.value = "";
      this.dateInput.value = "";
      this.prioritySelect.value = "low";
      this.showAlertMessage("Task added successfully", "success");
    }
  }

  handleClearAllTodos() {
    this.todoManager.clearAllTodos();
    this.showAllTodos();
    this.showAlertMessage("All todos cleared successfully", "success");
  }

  showAllTodos() {
    const todos = this.todoManager.filterTodos("all");
    this.displayTodos(todos);
  }

  displayTodos(todos) {
    this.todosListBody.innerHTML = "";

    if (todos.length === 0) {
      this.todosListBody.innerHTML = `<tr><td colspan="5" class="text-center">No task found</td></tr>`;
      return;
    }

    todos.forEach((todo) => {
      this.todosListBody.innerHTML += `
        <tr class="todo-item" data-id="${todo.id}">
          <td>${this.todoItemFormatter.formatTask(todo.task)}</td>
          <td>${this.todoItemFormatter.formatDueDate(todo.dueDate)}</td>
          <td class="priority-${todo.priority}">${this.todoItemFormatter.formatPriority(todo.priority)}</td>
          <td>${this.todoItemFormatter.formatStatus(todo.completed)}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="uiManager.handleEditTodo('${
              todo.id
            }')">
              <i class="bx bx-edit-alt bx-bx-xs"></i>    
            </button>
            <button class="btn btn-success btn-sm" onclick="uiManager.handleToggleStatus('${
              todo.id
            }')">
              <i class="bx bx-check bx-xs"></i>
            </button>
            <button class="btn btn-error btn-sm" onclick="uiManager.handleDeleteTodo('${
              todo.id
            }')">
              <i class="bx bx-trash bx-xs"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }

  handleEditTodo(id) {
    const todo = this.todoManager.todos.find((t) => t.id === id);
    if (todo) {
      this.taskInput.value = todo.task;
      this.prioritySelect.value = todo.priority;
      this.todoManager.deleteTodo(id);

      const handleUpdate = () => {
        const updatedTask = this.taskInput.value;
        const updatedPriority = this.prioritySelect.value;
        if (updatedTask === "") {
          this.showAlertMessage("Task cannot be empty", "error");
          return;
        }
        this.todoManager.addTodo(
          updatedTask,
          this.dateInput.value,
          updatedPriority
        );
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAlertMessage("Todo updated successfully", "success");
        this.showAllTodos();
        this.taskInput.value = "";
        this.prioritySelect.value = "low";
        this.addBtn.removeEventListener("click", handleUpdate);
      };

      this.addBtn.innerHTML = "<i class='bx bx-check bx-sm'></i>";
      this.addBtn.addEventListener("click", handleUpdate);
    }
  }

  handleToggleStatus(id) {
    this.todoManager.toggleTodoStatus(id);
    this.showAllTodos();
  }

  handleDeleteTodo(id) {
    this.todoManager.deleteTodo(id);
    this.showAlertMessage("Todo deleted successfully", "success");
    this.showAllTodos();
  }

  handleFilterTodos(status) {
    const filteredTodos = this.todoManager.filterTodos(status);
    this.displayTodos(filteredTodos);
  }

  showAlertMessage(message, type) {
    this.alertMessage.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    this.alertMessage.classList.add("show");
    setTimeout(() => {
      this.alertMessage.classList.remove("show");
    }, 2000);
  }

  initDragAndDrop() {
    const dragStart = (e) => {
      e.dataTransfer.setData("text/plain", e.target.dataset.id);
    };

    const dragOver = (e) => {
      e.preventDefault();
      const target = e.target.closest(".todo-item");
      if (target) {
        target.classList.add("drag-over");
      }
    };

    const dragLeave = (e) => {
      const target = e.target.closest(".todo-item");
      if (target) {
        target.classList.remove("drag-over");
      }
    };

    const drop = (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const draggedElement = document.querySelector(`[data-id='${id}']`);
      const dropZone = e.target.closest(".todo-item");
      dropZone.classList.remove("drag-over");

      if (draggedElement !== dropZone) {
        const draggedIndex = Array.from(this.todosListBody.children).indexOf(
          draggedElement
        );
        const dropZoneIndex = Array.from(this.todosListBody.children).indexOf(
          dropZone
        );
        this.todosListBody.insertBefore(
          draggedElement,
          draggedIndex < dropZoneIndex ? dropZone.nextSibling : dropZone
        );

        const reorderedTodos = Array.from(this.todosListBody.children).map(
          (item) => {
            const id = item.dataset.id;
            return this.todoManager.todos.find((todo) => todo.id === id);
          }
        );

        this.todoManager.todos = reorderedTodos;
        this.todoManager.saveToLocalStorage();
      }
    };

    this.todosListBody.addEventListener("dragstart", dragStart);
    this.todosListBody.addEventListener("dragover", dragOver);
    this.todosListBody.addEventListener("dragleave", dragLeave);
    this.todosListBody.addEventListener("drop", drop);
  }

  handleThemeSwitching() {
    const currentTheme = localStorage.getItem("theme") || "light";
    this.applyTheme(currentTheme);

    this.themeSwitcherBtn.addEventListener("click", () => {
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.applyTheme(newTheme);
    });
  }

  applyTheme(theme) {
    document.body.classList.toggle("dark-theme", theme === "dark");
    localStorage.setItem("theme", theme);
  }
}

// Instantiate classes and set up event handlers
const todoItemFormatter = new TodoItemFormatter();
const todoManager = new TodoManager(todoItemFormatter);
const uiManager = new UIManager(todoManager, todoItemFormatter);
