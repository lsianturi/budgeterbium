import moment from 'moment'
import { guid } from '../../../utils'
import { saveBudget, fetchBudgets, fetchCategories, saveCategory } from '../api'

const verifyUniqueMonth = (budgets, budget) => {
  let month = moment(budget.month)
  return !Object.values(budgets).find((o) => {
    if (o.id === budget.id) return false
    return month.isSame(o.month, 'month')
  })
}

export const createBudget = ({ commit, state }, data) => {
  if (!verifyUniqueMonth(state.budgets, data)) {
    return Promise.reject(new Error('A budget already exists for this month'))
  }

  let id = guid()
  let budget = Object.assign({ id: id }, data)

  budget.budgeted = 0
  budget.spent = 0
  budget.income = 0

  commit('CREATE_BUDGET', { budget: budget })
  saveBudget(budget).then((value) => {
    // we save the budget, what's next?
  })
}

export const updateBudget = ({ commit, state }, data) => {
  if (!verifyUniqueMonth(state.budgets, data)) {
    return Promise.reject(new Error('A budget already exist for this month'))
  }

  commit('UPDATE_BUDGET', { budget: data })
  saveBudget(data)
}

export const duplicateBudget = ({ commit, dispatch, getters }, data) => {
  /*
  * Expects an existing budget object, budget, and an budget to be copied, baseBudget
  * Duplicates all budget categories and budgeted amounts to the new budget
   */
  if (!(data.budget && data.baseBudget)) return Promise.reject(new Error('Incorrect data sent to duplicateBudget'))

  // clone our object in case we received something from the store
  let budget = Object.assign({}, data.budget)

  // let's reset some information first
  budget.budgeted = 0
  budget.budgetCategories = null
  // note that we don't reset the spent or income because we aren't
  // changing any transactions, which are what determine those values

  commit('UPDATE_BUDGET', { budget: budget })

  budget = getters.getBudgetById(budget.id)

  if ('budgetCategories' in data.baseBudget) {
    Object.keys(data.baseBudget.budgetCategories).forEach((key) => {
      dispatch('createBudgetCategory', {
        budget: budget,
        budgetCategory: {
          category: data.baseBudget.budgetCategories[key].category,
          budgeted: data.baseBudget.budgetCategories[key].budgeted,
          spent: 0 // TODO: grab this value when we have transactions!
        }
      })
    })
  }

  saveBudget(budget)

  return budget
}

export const loadBudgets = ({ state, commit }) => {
  if (!state.budgets || Object.keys(state.budgets).length === 0) {
    return fetchBudgets().then((res) => {
      commit('LOAD_BUDGETS', res)
    })
  }
}

export const updateBudgetBalance = ({ commit, getters }, data) => {
  commit('UPDATE_BUDGET_BALANCE', data)
  saveBudget(getters.getBudgetById(data.budget.id))
}

export const createCategory = ({ commit, state }, data) => {
  let id = guid()
  let category = Object.assign({ id: id }, data)
  commit('CREATE_CATEGORY', { category: category })
  saveCategory(category)

  return category
}

export const loadCategories = ({ commit, state }) => {
  if (!state.categories || Object.keys(state.categories).length === 0) {
    return fetchCategories().then((res) => {
      commit('LOAD_CATEGORIES', res)
    })
  }
}

export const createBudgetCategory = ({ commit, dispatch, getters }, data) => {
  if (!data.budget.budgetCategories || Object.keys(data.budget.budgetCategories).length === 0) {
    commit('CREATE_EMPTY_BUDGET_CATEGORY_OBJECT', data.budget)
  }

  let id = guid()
  let budgetCategory = Object.assign({ id: id }, data.budgetCategory)

  commit('CREATE_BUDGET_CATEGORY', { budget: data.budget, budgetCategory: budgetCategory })

  saveBudget(getters.getBudgetById(data.budget.id))

  dispatch('updateBudgetBalance', {
    budget: data.budget,
    param: 'budgeted',
    value: budgetCategory.budgeted
  })
}

export const updateBudgetCategory = ({ commit, dispatch, getters }, data) => {
  let newBudget = data.budgetCategory.budgeted
  let oldBudget = getters.getBudgetCategoryById(data.budget.id, data.budgetCategory.id).budgeted

  if (newBudget !== oldBudget) {
    dispatch('updateBudgetBalance', {
      budget: data.budget,
      param: 'budgeted',
      value: newBudget - oldBudget
    })
  }

  commit('UPDATE_BUDGET_CATEGORY', data)

  saveBudget(getters.getBudgetById(data.budget.id))
}

export const updateBudgetCategorySpent = ({ commit, dispatch, getters }, data) => {
  commit('UPDATE_BUDGET_CATEGORY_BALANCE', { budget: data.budget, value: data.amount, budgetCategory: data.budgetCategory, param: 'spent' })

  dispatch('updateBudgetBalance', {
    budget: data.budget,
    param: 'spent',
    value: data.amount - data.budget.spent
  })
  saveBudget(getters.getBudgetById(data.budget.id))
}
