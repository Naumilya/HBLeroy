const { Telegraf } = require('telegraf')
const dotenv = require('dotenv')
const petrovich = require('petrovich')
const fs = require('fs')
dotenv.config()
const bot = new Telegraf(process.env.ACCESS_TOKEN)

// Чтение данных сотрудников из JSON файла
const employeesData = fs.readFileSync('employees.json')
const employees = JSON.parse(employeesData).employees

// Чтение данных должностей с исключениями из JSON файла
const positionsData = fs.readFileSync('positions.json')
const positionExceptions = JSON.parse(positionsData)

// Функция для склонения ФИО
function declineEmployeeInfo(employee) {
	// Разделим имя на части (Фамилия Имя Отчество)
	const [lastName, firstName, patronymic] = employee.name.split(' ')

	// Склоняем ФИО в родительный падеж (т.к. в сообщении "день рождения у...")
	const declinedName = petrovich(
		{
			first: firstName,
			last: lastName,
			middle: patronymic,
			gender: employee.gender, // Добавляем пол для корректного склонения
		},
		'genitive'
	)

	// Используем исключение для должности или возвращаем исходное слово
	const declinedPosition =
		positionExceptions[employee.position] || employee.position

	return {
		name: `${declinedName.last} ${declinedName.first} ${declinedName.middle}`,
		position: declinedPosition,
	}
}

// Функция для проверки дней рождения
function checkBirthdays() {
	const today = new Date().toISOString().slice(5, 10) // Формат MM-DD

	employees.forEach(employee => {
		const birthday = employee.dateBirthday.slice(5, 10) // Извлекаем MM-DD
		if (birthday === today) {
			// Склоняем имя и должность
			const declinedEmployee = declineEmployeeInfo(employee)

			// Формируем сообщение
			const message = `Сегодня день рождения у ${declinedEmployee.position} ${declinedEmployee.name}! Поздравляем!`

			// Отправляем сообщение в группу
			bot.telegram
				.sendMessage(process.env.CHAT_ID, message)
				.then(() => {
					console.log(`Сообщение отправлено: ${message}`)
				})
				.catch(error => {
					console.error('Ошибка при отправке сообщения:', error)
				})
		}
	})
}

// Устанавливаем интервал для проверки дней рождений каждый день в 9:00
function startBirthdayChecker() {
	// Текущая дата и время
	const now = new Date()
	const millisTill9AM =
		new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0) - now
	setTimeout(function () {
		checkBirthdays()
		setInterval(checkBirthdays, 24 * 60 * 60 * 1000) // 24 часа
	}, millisTill9AM)
}

bot.launch()

// Запускаем проверку дней рождения
startBirthdayChecker()
