document.addEventListener('DOMContentLoaded', function() {
    const createListButton = document.getElementById('create-list-button');
    const newListNameInput = document.getElementById('new-list-name');
    const listsContainer = document.getElementById('lists-container');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');

    const priorityModal = document.getElementById('priority-modal');
    const closePriorityModal = document.getElementById('close-priority-modal');
    const priorityButtons = document.querySelectorAll('.priority-button');

    const pomodoroModal = document.getElementById('pomodoro-modal');
    const closePomodoroModal = document.getElementById('close-pomodoro-modal');
    const savePomodoroSettings = document.getElementById('save-pomodoro-settings');
    const cancelPomodoroSettings = document.getElementById('cancel-pomodoro-settings');
    const settingsTimerButton = document.getElementById('settings-timer');
    const workIntervalInput = document.getElementById('work-interval');
    const breakIntervalInput = document.getElementById('break-interval');

    let todoLists = [];
    let currentListForPriority = null;
    let currentPomodoro = {
        work: 25, // in minutes
        break: 5  // in minutes
    };

    // Pomodoro Timer Elements
    const timerDisplay = document.getElementById('timer-display');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');

    // Pomodoro Timer Variables
    let timer;
    let isRunning = false;
    let isWorkSession = true;
    let timeRemaining = currentPomodoro.work * 60; // in seconds

    // Load data from localStorage
    if (localStorage.getItem('todoLists')) {
        todoLists = JSON.parse(localStorage.getItem('todoLists'));
        todoLists.forEach(function(listData) {
            createTodoListElement(listData);
        });
    }

    // Load theme from localStorage
    if (localStorage.getItem('theme')) {
        document.body.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
        updateThemeToggleIcon();
    }

    // Load Pomodoro settings from localStorage
    if (localStorage.getItem('pomodoroSettings')) {
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings'));
        currentPomodoro.work = settings.work;
        currentPomodoro.break = settings.break;
        timeRemaining = currentPomodoro.work * 60;
        updateTimerDisplay();
    }

    // Event Listeners
    createListButton.addEventListener('click', createNewList);
    newListNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createNewList();
        }
    });
    themeToggle.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', filterTasks);

    // Priority Modal Event Listeners
    closePriorityModal.addEventListener('click', () => {
        priorityModal.style.display = 'none';
        currentListForPriority = null;
    });

    priorityButtons.forEach(button => {
        button.addEventListener('click', () => {
            const priority = button.getAttribute('data-priority');
            if (currentListForPriority) {
                currentListForPriority.selectedPriority = priority;
                priorityModal.style.display = 'none';
                addTask(currentListForPriority.listData, currentListForPriority.todoListElement, currentListForPriority.taskText, priority);
                currentListForPriority = null;
            }
        });
    });

    // Pomodoro Modal Event Listeners
    closePomodoroModal.addEventListener('click', () => {
        pomodoroModal.style.display = 'none';
    });

    cancelPomodoroSettings.addEventListener('click', () => {
        pomodoroModal.style.display = 'none';
    });

    savePomodoroSettings.addEventListener('click', () => {
        const work = parseInt(workIntervalInput.value);
        const brk = parseInt(breakIntervalInput.value);
        if (isNaN(work) || isNaN(brk) || work <= 0 || brk <= 0) {
            alert('Please enter valid positive numbers for intervals.');
            return;
        }
        currentPomodoro.work = work;
        currentPomodoro.break = brk;
        localStorage.setItem('pomodoroSettings', JSON.stringify(currentPomodoro));
        resetTimer();
        pomodoroModal.style.display = 'none';
    });

    settingsTimerButton.addEventListener('click', () => {
        // Pre-fill with current settings
        workIntervalInput.value = currentPomodoro.work;
        breakIntervalInput.value = currentPomodoro.break;
        pomodoroModal.style.display = 'block';
    });

    // Pomodoro Timer Event Listeners
    startTimerButton.addEventListener('click', startTimer);
    pauseTimerButton.addEventListener('click', pauseTimer);
    resetTimerButton.addEventListener('click', resetTimer);

    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target == priorityModal) {
            priorityModal.style.display = 'none';
            currentListForPriority = null;
        }
        if (event.target == pomodoroModal) {
            pomodoroModal.style.display = 'none';
        }
    });

    function createNewList() {
        const listName = newListNameInput.value.trim();
        if (listName === '') {
            alert('Please enter a name for the new todo list.');
            return;
        }

        const listData = {
            id: Date.now(),
            name: listName,
            tasks: []
        };

        todoLists.push(listData);
        saveData();
        createTodoListElement(listData);
        newListNameInput.value = '';
    }

    function createTodoListElement(listData) {
        const todoList = document.createElement('div');
        todoList.classList.add('todo-list');
        todoList.dataset.id = listData.id;

        const title = document.createElement('h2');
        title.textContent = listData.name;
        todoList.appendChild(title);

        const deleteListButton = document.createElement('button');
        deleteListButton.classList.add('delete-list');
        deleteListButton.innerHTML = '&times;';
        todoList.appendChild(deleteListButton);

        deleteListButton.addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete the list "${listData.name}"?`)) {
                todoLists = todoLists.filter(list => list.id !== listData.id);
                saveData();
                todoList.remove();
            }
        });

        const addTaskInput = document.createElement('input');
        addTaskInput.type = 'text';
        addTaskInput.placeholder = 'Add a new task...';
        todoList.appendChild(addTaskInput);

        const addTaskButton = document.createElement('button');
        addTaskButton.textContent = 'Add Task';
        addTaskButton.classList.add('add-task-button');
        todoList.appendChild(addTaskButton);

        addTaskButton.addEventListener('click', function() {
            const taskText = addTaskInput.value.trim();
            if (taskText === '') {
                alert('Please enter a task.');
                return;
            }
            // Open priority modal
            currentListForPriority = {
                listData: listData,
                todoListElement: todoList,
                taskText: taskText
            };
            priorityModal.style.display = 'block';
            addTaskInput.value = '';
        });

        addTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTaskButton.click();
            }
        });

        const tasksUl = document.createElement('ul');
        tasksUl.classList.add('tasks');
        todoList.appendChild(tasksUl);

        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar');
        const progressFill = document.createElement('div');
        progressFill.classList.add('progress-bar-fill');
        progressBar.appendChild(progressFill);
        todoList.appendChild(progressBar);

        const plantContainer = document.createElement('div');
        plantContainer.classList.add('plant-container');
        todoList.appendChild(plantContainer);

        // Load existing tasks
        listData.tasks.forEach(function(taskData) {
            createTaskElement(taskData, tasksUl, listData, todoList);
        });

        listsContainer.appendChild(todoList);
        updatePlantGrowth(todoList, listData);
    }

    function addTask(listData, todoList, taskText, priority = 'none') {
        const taskData = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: priority
        };

        listData.tasks.push(taskData);
        saveData();

        const tasksUl = todoList.querySelector('.tasks');
        createTaskElement(taskData, tasksUl, listData, todoList);
        updatePlantGrowth(todoList, listData);
    }

    function createTaskElement(taskData, tasksUl, listData, todoList) {
        const taskLi = document.createElement('li');

        const priorityIndicator = document.createElement('div');
        priorityIndicator.classList.add('priority', taskData.priority);
        taskLi.appendChild(priorityIndicator);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = taskData.completed;
        taskLi.appendChild(checkbox);

        const taskLabel = document.createElement('span');
        taskLabel.textContent = taskData.text;
        taskLi.appendChild(taskLabel);

        const editButton = document.createElement('button');
        editButton.classList.add('edit-task');
        editButton.innerHTML = '&#9998;';
        taskLi.appendChild(editButton);

        const deleteTaskButton = document.createElement('button');
        deleteTaskButton.classList.add('delete-task');
        deleteTaskButton.innerHTML = '&times;';
        taskLi.appendChild(deleteTaskButton);

        tasksUl.appendChild(taskLi);

        // Event Listeners
        checkbox.addEventListener('change', function() {
            taskData.completed = checkbox.checked;
            saveData();
            updatePlantGrowth(todoList, listData);
            updateProgressBar(todoList, listData);
        });

        deleteTaskButton.addEventListener('click', function() {
            if (confirm('Delete this task?')) {
                listData.tasks = listData.tasks.filter(task => task.id !== taskData.id);
                saveData();
                taskLi.remove();
                updatePlantGrowth(todoList, listData);
                updateProgressBar(todoList, listData);
            }
        });

        editButton.addEventListener('click', function() {
            const newText = prompt('Edit task:', taskData.text);
            if (newText !== null && newText.trim() !== '') {
                taskData.text = newText.trim();
                saveData();
                taskLabel.textContent = taskData.text;
            }
        });

        updateProgressBar(todoList, listData);
    }

    function updatePlantGrowth(todoList, listData) {
        const tasks = listData.tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;

        const plantContainer = todoList.querySelector('.plant-container');
        plantContainer.innerHTML = ''; // Clear previous plant

        // Create the plant elements
        const plant = document.createElement('div');
        plant.classList.add('plant');
        plantContainer.appendChild(plant);

        // Show initial sapling
        const stem = document.createElement('div');
        stem.classList.add('stem');
        plant.appendChild(stem);

        // Adjust stem height based on completion
        const growthStage = totalTasks > 0 ? completedTasks / totalTasks : 0;
        const stemHeight = 50 + (70 * growthStage); // Minimum height 50px, max additional 70px

        stem.style.setProperty('--stem-height', stemHeight + 'px');

        // Leaves and flower based on growth
        if (growthStage >= 0.2) {
            const leafLeft = document.createElement('div');
            leafLeft.classList.add('leaf', 'left');
            leafLeft.style.bottom = (stemHeight * 0.3) + 'px';
            plant.appendChild(leafLeft);
            leafLeft.style.animation = 'grow-leaf 1s forwards';
        }

        if (growthStage >= 0.5) {
            const leafRight = document.createElement('div');
            leafRight.classList.add('leaf', 'right');
            leafRight.style.bottom = (stemHeight * 0.6) + 'px';
            plant.appendChild(leafRight);
            leafRight.style.animation = 'grow-leaf 1s forwards';
        }

        if (growthStage >= 0.8) {
            const leafTop = document.createElement('div');
            leafTop.classList.add('leaf', 'top');
            leafTop.style.bottom = (stemHeight * 0.8) + 'px';
            plant.appendChild(leafTop);
            leafTop.style.animation = 'grow-leaf 1s forwards';
        }

        if (growthStage === 1) {
            const flower = document.createElement('div');
            flower.classList.add('flower');

            // Randomly assign a flower variant for diversity
            const variant = 'variant-' + (Math.floor(Math.random() * 3) + 1);
            flower.classList.add(variant);

            plant.appendChild(flower);
            flower.style.animation = 'bloom 1s forwards';
        }
    }

    function updateProgressBar(todoList, listData) {
        const tasks = listData.tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const progressFill = todoList.querySelector('.progress-bar-fill');
        progressFill.style.width = `${progressPercentage}%`;
    }

    function saveData() {
        localStorage.setItem('todoLists', JSON.stringify(todoLists));
    }

    function toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeToggleIcon();
    }

    function updateThemeToggleIcon() {
        if (document.body.classList.contains('dark')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    }

    function filterTasks() {
        const query = searchInput.value.toLowerCase();
        const allTasks = document.querySelectorAll('.tasks li');

        allTasks.forEach(function(taskLi) {
            const taskText = taskLi.querySelector('span').textContent.toLowerCase();
            if (taskText.includes(query)) {
                taskLi.style.display = 'flex';
            } else {
                taskLi.style.display = 'none';
            }
        });
    }

    // Pomodoro Timer Functions
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        timer = setInterval(function() {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                alert(isWorkSession ? 'Work session completed! Take a break.' : 'Break session completed! Get back to work.');
                isWorkSession = !isWorkSession;
                timeRemaining = isWorkSession ? currentPomodoro.work * 60 : currentPomodoro.break * 60;
                updateTimerDisplay();
                startTimer(); // Automatically start the next session
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(timer);
        isRunning = false;
    }

    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        isWorkSession = true;
        timeRemaining = currentPomodoro.work * 60;
        updateTimerDisplay();
    }

    // Initialize Pomodoro Timer
    updateTimerDisplay();
});
