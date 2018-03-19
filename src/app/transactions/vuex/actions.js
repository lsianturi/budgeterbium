import { guid } from '../../../utils'
import { saveTransaction, deleteTransaction as deleteTransactionFromAPI, fetchTransactions, saveBusiness, fetchBusinesses, deleteBusiness as deleteBusinessFromAPI } from '../api'

const prepareTransaction = (getters, data) => {
  let budget = getters.getBudgetByDate(data.date)
  if (!budget) throw new Error('Could not find a budget for the date ' + data.date)
  data.budget = budget.id
  console.log('data.budget: ', data.budget)

  let budgetCategory = getters.getBudgetCategoryByBudgetAndCategory(budget.id, data.category)
  if (!budgetCategory) throw new Error('Could not find a budget category for ' + data.category)

  return { preparedData: data, budgetCategory: budgetCategory, budget: budget }
}

export const createTransaction = ({ commit, dispatch, getters }, data) => {
  let { preparedData, budgetCategory, budget } = prepareTransaction(getters, data)

  let id = guid()
  let transaction = Object.assign({ id: id }, preparedData)

  dispatch('updateBudgetCategorySpent', {
    budgetCategory: budgetCategory,
    budget: budget,
    amount: transaction.amount
  })

  dispatch('updateAccountBalance', {
    account: getters.getAccountById(data.account),
    amount: transaction.amount
  })

  commit('CREATE_TRANSACTION', { transaction: transaction })
  saveTransaction(transaction)
}

export const updateTransaction = ({ commit, getters }, data) => {
  let { preparedData } = prepareTransaction(getters, data)

  commit('UPDATE_TRANSACTION', { transaction: preparedData })
  saveTransaction(preparedData)
}

export const deleteTransaction = ({ commit }, data) => {
  commit('DELETE_TRANSACTION', { transaction: data })
  deleteTransactionFromAPI(data)
}

export const loadTransactions = ({ state, commit }) => {
  if (!state.transactions || Object.keys(state.transactions).length === 0) {
    return fetchTransactions().then((res) => {
      commit('LOAD_TRANSACTIONS', res)
    })
  }
}

export const createBusiness = ({ commit, state }, data) => {
  let id = guid()
  let business = Object.assign({ id: id }, data)
  commit('CREATE_BUSINESS', { business: business })
  saveBusiness(business)

  return business
}

export const loadBusinesses = ({ state, commit }) => {
  if (!state.businesses || Object.keys(state.businesses).length === 0) {
    return fetchBusinesses().then((res) => {
      commit('LOAD_BUSINESSES', res)
    })
  }
}

export const deleteBusiness = ({ commit }, data) => {
  commit('DELETE_BUSINESS', { business: data })
  deleteBusinessFromAPI(data)
}
