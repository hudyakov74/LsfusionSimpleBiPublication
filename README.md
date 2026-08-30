# BiView - Модуль генерации виртуальных таблиц для BI систем

# Для добавления BiView
menu for bi publication:
for example add in NAVIGATOR in module MAIN         

NAVIGATOR {
  NEW biViewForm;  
}

## ДОПОЛНИТЕЛЬНО скрипт для копирования в буфер обмена значений футеров таблиц и сводных таблиц
for oneClick copy from FOOTER add
onWebClientInit() + {
    onWebClientInit('myBalanceCopyFooter.js') <- 1;
}

## ДОПОЛНИТЕЛЬНО скрипт калькулятора для numeric полей
for Calculator on numeric input add

onWebClientInit() + {
    onWebClientInit('myBalanceCalculator.css') <- 1;
    onWebClientInit('myBalanceCalculator.js') <- 1;
}

## Описание

BiView — это модуль платформы lsFusion для автоматической генерации PostgreSQL VIEW (виртуальных таблиц) и управления доступом пользователей к ним. Модуль предназначен для интеграции с BI системами (Business Intelligence) и позволяет создавать удобные представления данных для аналитики.

Поддержка связаных таблиц простая - только как LOOKUP более сложное лучше реализовать на стороне BI системы.

## Основные возможности

- ✅ **Автоматическая генерация SQL VIEW** из конфигурации в lsFusion
- ✅ **Управление доступом пользователей** к виртуальным таблицам
- ✅ **Поддержка связанных таблиц** через LEFT JOIN
- ✅ **Фильтрация колонок** (включение/исключение полей)
- ✅ **Экранирование имен** с пробелами и специальными символами
- ✅ **Полная генерация SQL скриптов** (VIEW + пользователи + права доступа)
- ✅ **Просмотр и копирование SQL** через встроенную форму

## Структура модуля

### 1. [`BiUsers.lsf`](src/main/lsfusion/biView/BiUsers.lsf:1)
**Управление аккаунтами доступа к виртуальным таблицам**

Определяет класс `BiUsers` для хранения учетных данных пользователей:
- `login` — логин пользователя
- `password` — пароль пользователя
- `schema` — схема базы данных
- `comment` — комментарий

**Форма:** `biUsersList` — управление пользователями с возможностью добавления и удаления.

**Примечание:** В реальной БД пользователи создаются с префиксом `biuser` для безопасности.

### 2. [`BiViewList.lsf`](src/main/lsfusion/biView/BiViewList.lsf:1)
**Список публикаций виртуальных таблиц и их колонок**

Определяет два основных класса:

#### Класс `BiViewList` — конфигурация VIEW
- `table` — исходная таблица PostgreSQL
- `enable` — включение/отключение VIEW
- `disableKey0` — исключение первичного ключа из SELECT
- `order` — порядок создания VIEW
- `name` — имя виртуальной таблицы
- `sqlManual` — ручное редактирование SQL (переопределение автогенерации)
- `isSqlManual` — флаг ручного редактирования

#### Класс `BiViewColumn` — конфигурация колонок VIEW
- `tableBi` — владелец колонки (ссылка на BiViewList)
- `column` — исходная колонка из системной таблицы
- `columnBi` — ссылка на другую колонку (для связей)
- `name` — имя колонки в VIEW
- `enable` — включение/отключение колонки
- `columnTableBi` — таблица для связанного значения
- `columnValueBi` — колонка для связанного значения

#### Формы:
- `formBiViewList` — просмотр списка VIEW
- `formBiViewColumn` — просмотр колонок
- `formBiViewListSql` — редактирование SQL с возможностью восстановления стандартного запроса
- `formBiViewSql` — просмотр сгенерированного SQL

### 3. [`BiViewSqlGenerator.lsf`](src/main/lsfusion/biView/BiViewSqlGenerator.lsf:1)
**Генерация SQL скриптов для PostgreSQL**

Основные функции:

#### Вспомогательные функции:
- `quoteIfNeeded(STRING s)` — экранирование имен с пробелами в двойные кавычки
- `viewName(BiViewList s)` — генерация имени VIEW с префиксом `v_`
- `tableSid(BiViewList s)` — получение имени таблицы PostgreSQL
- `tableAlias(BiViewColumn c)` — уникальный алиас для колонки

#### Основные функции генерации:
- `selectColumnsList(BiViewList s)` — генерация списка колонок для SELECT
  - Учитывает флаг `enable` для каждой колонки
  - Поддерживает связанные таблицы через JOIN
  - Присваивает имена через AS

- `joinsList(BiViewList s)` — генерация LEFT JOIN'ов для связанных таблиц
  - Поддерживает связи с другими VIEW
  - Поддерживает связи с таблицами в той же схеме

- `generateViewSql(BiViewList s)` — основная функция генерации SQL для CREATE VIEW
  - Проверяет флаг `isSqlManual` для использования ручного SQL
  - Генерирует DROP VIEW IF EXISTS
  - Создает CREATE OR REPLACE VIEW
  - Включает SELECT с колонками и JOIN'ами

- `generateUserSql(BiUsers u)` — генерация SQL для создания пользователя в PostgreSQL
  - Использует PL/pgSQL блок для проверки существования пользователя
  - Создает или обновляет пароль

- `generateGrantSql(BiViewList s, BiUsers u)` — генерация SQL для назначения прав доступа
  - GRANT SELECT для разрешенного доступа
  - REVOKE для запрещенного доступа

#### Комбинированные функции:
- `generateAllViewsSql()` — генерация SQL для всех включенных VIEW
- `generateAllUsersSql()` — генерация SQL для всех пользователей
- `generateAllGrantsSql()` — генерация SQL для всех прав доступа
- `generateCompleteSql()` — полный SQL скрипт (схема + пользователи + VIEW + права)

### 4. [`BiViewExport.lsf`](src/main/lsfusion/biView/BiViewExport.lsf:1)
**Экспорт и просмотр SQL скриптов**

Локальные свойства для хранения SQL:
- `sqlViewScript` — SQL для VIEW
- `sqlUserScript` — SQL для пользователей
- `sqlGrantScript` — SQL для прав доступа
- `sqlCompleteScript` — полный SQL скрипт

Действия для генерации:
- `showViewSql(BiViewList s)` — показать SQL для одного VIEW
- `showAllViewsSql()` — показать SQL для всех VIEW
- `showUsersSql()` — показать SQL для пользователей
- `showGrantsSql()` — показать SQL для прав доступа
- `showCompleteSql()` — показать полный SQL скрипт
- `openSqlViewer()` — открыть окно просмотра SQL

Форма `sqlScriptViewer` — просмотр всех SQL скриптов в одном месте.

### 5. [`BiViewForm.lsf`](src/main/lsfusion/biView/BiViewForm.lsf:1)
**Главная форма для управления VIEW и генерации SQL**

Вспомогательные функции:
- `tableKey(Table t)` — получение первичного ключа таблицы

Формы:
- `selectTableForBi` — выбор исходной таблицы для VIEW
- `selectColumnsForBi` — выбор и просмотр колонок таблицы
- `biViewForm` — **главная форма управления**

#### Главная форма `biViewForm` включает:

**Раздел VIEW (BiViewList):**
- Управление (DELETE, NEW)
- `enable` — включение/отключение VIEW
- `disableKey0` — исключение первичного ключа
- `order` — порядок создания
- `name` — имя VIEW
- `class` — выбор исходной таблицы с диалогом
- `isSqlManual` — флаг ручного редактирования
- Кнопка просмотра SQL

**Раздел колонок (BiViewColumn):**
- Управление (DELETE, NEW)
- `refillColumns` — автоматическое заполнение колонок из таблицы
- `selectColumnsForBi` — просмотр доступных колонок
- `enable` — включение/отключение колонки
- `nameC` — имя колонки в VIEW
- `caption` — имя колонки в системе с диалогом выбора
- `columnTableBi` — таблица для связанного значения
- `columnValueBi` — колонка для связанного значения
- `sid` — системный идентификатор колонки

**Раздел пользователей (BiUsers):**
- `editUser` — открыть форму управления пользователями
- `readPermission` — флаг доступа на чтение
- `login` — логин с префиксом `biuser`

**Кнопки действий:**
- `generateViewSql` — показать полный SQL скрипт
- `exec` — опубликовать (выполнить SQL в БД)

## Примеры использования

### Пример 1: Простой VIEW без связей

```
BiViewList:
  name = "Продажи"
  table = sales
  enable = true

BiViewColumn:
  name = "id", column = id, enable = true
  name = "дата", column = date, enable = true
  name = "сумма", column = amount, enable = true
```

**Генерируемый SQL:**
```sql
CREATE OR REPLACE VIEW report_lsfuson.v_Продажи AS
SELECT
  sales.key0 as key0,
  sales.id AS id, sales."дата" AS "дата", sales."сумма" AS "сумма"
FROM sales;
```

### Пример 2: VIEW со связанной таблицей

```
BiViewList:
  name = "Продажи с клиентами"
  table = sales

BiViewColumn:
  name = "id", column = id, enable = true
  name = "имя клиента", column = customer_id, 
    columnTableBi = v_Клиенты, columnValueBi = name, enable = true
```

**Генерируемый SQL:**
```sql
CREATE OR REPLACE VIEW report_lsfuson.v_Продажи_с_клиентами AS
SELECT
  sales.key0 as key0,
  sales.id AS id, v_Клиенты."имя клиента" AS "имя клиента"
FROM sales
LEFT JOIN report_lsfuson.v_Клиенты ON sales.customer_id = v_Клиенты.key0;
```

### Пример 3: Полный скрипт с пользователями и правами

1. Создать пользователей в `BiUsers`
2. Установить флаги `readPermission` для каждой пары (VIEW, пользователь)
3. Нажать кнопку `generateViewSql` в форме `biViewForm`
4. Скопировать SQL из окна просмотра
5. Выполнить в PostgreSQL

**Генерируемый SQL включает:**
- CREATE SCHEMA IF NOT EXISTS report_lsfuson;
- CREATE USER для каждого пользователя
- CREATE OR REPLACE VIEW для каждого VIEW
- GRANT SELECT для разрешенного доступа

## Особенности реализации

### Экранирование имен
- Имена с пробелами автоматически заключаются в двойные кавычки
- Поддерживаются русские символы в именах

### Префиксы
- **VIEW:** `v_` (например, `v_Продажи`)
- **Пользователи:** `biuser` (например, `biuseranalyst`)
- **Схема:** `report_lsfuson`

### Порядок создания
- Используется поле `order` в `BiViewList` для определения последовательности
- VIEW с меньшим `order` создаются раньше (для правильного разрешения зависимостей)

### Фильтрация
- Только колонки с `enable = true` включаются в SELECT
- Только VIEW с `enable = true` включаются в полный скрипт
- Только пары (VIEW, пользователь) с `readPermission = true` получают GRANT SELECT

### Ручное редактирование SQL
- Если установлен флаг `isSqlManual`, используется содержимое поля `sqlManual`
- Можно восстановить стандартный SQL через форму `formBiViewListSql`

## Зависимости

```
MODULE BiView;

REQUIRE Reflection;  // для работы с системными таблицами
REQUIRE Utils;       // для утилит (isSubstring и т.д.)
```

## Интеграция с BI системами

Сгенерированные VIEW можно использовать в:
- **Superset** — для создания дашбордов
- **Metabase** — для аналитики
- **Tableau** — для визуализации
- **Power BI** — для отчетов
- Любых других BI инструментах, поддерживающих PostgreSQL

## Рекомендации по использованию

1. **Планирование VIEW:**
   - Определите, какие данные нужны для аналитики
   - Спланируйте иерархию VIEW (какие VIEW зависят от других)

2. **Создание конфигурации:**
   - Создайте записи в `BiViewList` для каждого VIEW
   - Добавьте колонки в `BiViewColumn`
   - Установите флаги `enable` для нужных колонок

3. **Управление доступом:**
   - Создайте пользователей в `BiUsers`
   - Установите флаги `readPermission` для каждого пользователя и VIEW

4. **Генерация и публикация:**
   - Используйте форму `biViewForm` для просмотра конфигурации
   - Нажмите `generateViewSql` для просмотра SQL
   - Нажмите `exec` для публикации в PostgreSQL

5. **Проверка:**
   - Проверьте созданные VIEW в PostgreSQL:
     ```sql
     SELECT * FROM information_schema.views 
     WHERE table_schema = 'report_lsfuson';
     ```
   - Проверьте права пользователей:
     ```sql
     SELECT * FROM information_schema.role_table_grants 
     WHERE grantee = 'biuseranalyst';
     ```
