// Chave de API da OpenWeather
const apiKey = '22e966f689b50d30020f27ef9d990ccd';

// Código para atualizar o relógio em tempo real
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
}

// Chama a função de atualização de relógio a cada segundo
setInterval(updateClock, 1000);

// Função para carregar o clima de Muriaé
async function loadWeather() {
    const city = 'Muriaé';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=pt_br`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod === 200) {
            const temperature = data.main.temp;
            const weatherDescription = data.weather[0].description;

            // Determina o ícone de tema baseado na descrição do clima
            const theme = getWeatherTheme(weatherDescription);

            // Atualiza o elemento de clima com a temperatura e o ícone de tema
            const weatherElement = document.getElementById('weather');
            weatherElement.innerHTML = `
                <span>${temperature.toFixed(1)}°C - ${weatherDescription}</span>
                ${theme.icon}
            `;
            weatherElement.className = theme.iconClass;
        } else {
            console.error('Erro ao carregar os dados de clima:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar os dados de clima:', error);
    }
}

// Função para obter o tema do clima
function getWeatherTheme(description) {
    if (description.includes('chuva')) {
        return { icon: '<i class="fa-solid fa-cloud-rain"></i>', iconClass: 'icon-rain' };
    } else if (description.includes('sol') || description.includes('ensolarado')) {
        return { icon: '<i class="fa-solid fa-sun"></i>', iconClass: 'icon-sun' };
    } else if (description.includes('nublado')) {
        return { icon: '<i class="fa-solid fa-cloud"></i>', iconClass: 'icon-cloud' };
    } else {
        return { icon: '<i class="fa-solid fa-smog"></i>', iconClass: 'icon-smog' };
    }
}

// Chama a função para carregar o clima de Muriaé ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    loadWeather();
});

// Código para gerenciar as tarefas
$(document).ready(function () {
    loadTasks();

    $('#saveBtn').click(function () {
        const user = $('#userInput').val().trim();
        const taskInput = $('#task').val().trim();
        const categoryInput = $('#category').val().trim();
        const cityInput = $('#city').val().trim();
        const dateInput = $('#date').val().trim();
        const existingTaskIndex = $('#saveBtn').data('editIndex');

        // Verificar se todos os campos estão preenchidos
        if (!user || !taskInput || !categoryInput) {
            showMessage('Por favor, preencha todos os campos', 'danger');
            return;
        }

        // Verificar se a tarefa já foi incluída
        const tasks = loadTasksFromLocalStorage();
        const isDuplicate = tasks.some(task => 
            task.task === taskInput && task.category === categoryInput
        );

        if (isDuplicate) {
            showMessage('Tarefa já inclusa', 'danger');
            return;
        }

        if (existingTaskIndex !== undefined) {
            // Editar tarefa existente
            tasks[existingTaskIndex] = {
                ...tasks[existingTaskIndex],
                user,
                task: taskInput,
                category: categoryInput,
                city: cityInput,
                date: dateInput
            };
            saveTasksToLocalStorage(tasks);
            $('#saveBtn').data('editIndex', undefined).text('Salvar');
            showMessage('Tarefa editada com sucesso', 'success');
        } else {
            // Adicionar nova tarefa
            const newTask = {
                user,
                task: taskInput,
                category: categoryInput,
                city: cityInput,
                date: dateInput,
                createdDate: getFormattedDateTime(),
                completed: false
            };
            addNewTask(newTask);
            showMessage('Tarefa salva com sucesso', 'success');
        }

        $('#userInput').val('');
        $('#task').val('');
        $('#category').val('');
        $('#city').val('');
        $('#date').val('');
        loadTasks();
    });

    function addNewTask(task) {
        const tasks = loadTasksFromLocalStorage();
        tasks.unshift(task);
        saveTasksToLocalStorage(tasks);
    }

    $(document).on('change', '.completedCheckbox', function () {
        const rowIndex = $(this).closest('tr').index();
        const tasks = loadTasksFromLocalStorage();
        tasks[rowIndex].completed = $(this).is(':checked');
        saveTasksToLocalStorage(tasks);
        $(this).closest('tr').toggleClass('completed', tasks[rowIndex].completed);
    });

    $(document).on('click', '.deleteTask', function () {
        const rowIndex = $(this).closest('tr').index();
        const tasks = loadTasksFromLocalStorage();
        tasks.splice(rowIndex, 1);
        saveTasksToLocalStorage(tasks);
        loadTasks();
    });

    $(document).on('click', '.editTask', function () {
        const rowIndex = $(this).closest('tr').index();
        const tasks = loadTasksFromLocalStorage();
        const taskToEdit = tasks[rowIndex];

        $('#userInput').val(taskToEdit.user);
        $('#task').val(taskToEdit.task);
        $('#category').val(taskToEdit.category);
        $('#city').val(taskToEdit.city);
        $('#date').val(taskToEdit.date);
        $('#saveBtn').text('Editar').data('editIndex', rowIndex);
    });

    function loadTasks() {
        const tasks = loadTasksFromLocalStorage();
        const tasksTable = $('#tasksTable');
        tasksTable.empty();
    
        // Ordena as tarefas pelo campo `date` em ordem crescente
        tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    
        tasks.forEach((task, index) => {
            const row = $('<tr>');
            row.append(`<td>${task.user}</td>`);
            row.append(`<td>${task.task}</td>`);
            row.append(`<td>${task.category}</td>`);
            row.append(`<td>${task.city}</td>`);
            row.append(`<td>${task.date}</td>`);
            row.append(`<td>${task.createdDate}</td>`);
            const completedCheckbox = $('<input type="checkbox" class="completedCheckbox">');
            completedCheckbox.prop('checked', task.completed);
            row.append($('<td>').append(completedCheckbox));
            row.append(`
                <td>
                    <i class="fas fa-edit editTask"></i>
                    <i class="fas fa-trash deleteTask"></i>
                </td>
            `);
    
            if (task.completed) {
                row.addClass('completed');
            }
    
            tasksTable.append(row);
        });
    }
    

    function loadTasksFromLocalStorage() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    function saveTasksToLocalStorage(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function getFormattedDateTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function showMessage(message, type = 'success') {
        const messageDiv = document.getElementById('messageDiv');
        messageDiv.textContent = message;
        messageDiv.className = type === 'success' ? 'alert alert-success' : 'alert alert-danger';

        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 3000);
    }
});
