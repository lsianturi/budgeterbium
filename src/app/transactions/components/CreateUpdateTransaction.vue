<template>
  <tr class="transaction-create-update">
    <td>
      <span class="subtitle is-5">
        <p class="control has-icon has-addons">
          <datepicker name="month" input-class="input" v-model="transaction.date"></datepicker>
          <span class="icon">
            <i class="fa fa-calendar" aria-hidden="true"></i>
          </span>
        </p>
      </span>
    </td>
    <td>
      <multiselect
        :value="transaction.business"
        @input="updateSelection('business', $event)"
        :taggable="true"
        @tag="handleCreateBusiness"
        :options="getBusinessSelectList"
        placeholder="Select a business"
        label="name"
        track-by="id"
      ></multiselect>
    </td>
    <td>
      <multiselect
        :value="transaction.category"
        @input="updateSelection('category', $event)"
        :options="getCategorySelectList"
        placeholder="Select a category"
        label="name"
        track-by="id"
      ></multiselect>
    </td>
    <td>
      <multiselect
        :value="transaction.account"
        @input="updateSelection('account', $event)"
        :options="getAccountSelectList"
        placeholder="Select an account"
        label="name"
        track-by="id"
      ></multiselect>
    </td>
    <td>
      <p class="control">
        <input type="text" class="input" v-model="transaction.note">
      </p>
    </td>
    <td>
      <p class="control has-icon">
        <input type="number" step="0.01" class="input" v-model="debit"/>
        <span class="icon">
          <i class="fa fa-usd" aria-hidden="true"></i>
        </span>
      </p>
    </td>
    <td>
      <p class="control has-icon">
        <input type="number" step="0.01" class="input" v-model="credit"/>
        <span class="icon">
          <i class="fa fa-usd" aria-hidden="true"></i>
        </span>
      </p>
    </td>
    <td>
      <a class="button is-primary" @click.prevent="processSave">
        {{ this.editing ? 'Edit' : 'Save' }}
      </a>
    </td>
  </tr>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Datepicker from 'vuejs-datepicker'
import Multiselect from 'vue-multiselect'

export default {
  name: 'transaction-create-update',

  props: ['value'],

  components: {
    Datepicker,
    Multiselect
  },

  data () {
    return {
      transaction: {},
      debit: null,
      credit: null,
      editing: false
    }
  },
  mounted () {
    this.loadTransactions()
    this.loadBudgets()
    this.loadCategories()
    this.loadAccounts()
    this.loadBusinesses()
    if (this.value) {
      this.transaction = Object.assign({}, this.value)

      this.transaction.category = this.getCategoryById(this.transaction.category)
      this.transaction.account = this.getAccountById(this.transaction.account)
      this.transaction.business = this.getBusinessById(this.transaction.business)

      if (this.transaction.amount > 0) this.credit = this.transaction.amount
      else this.debit = this.transaction.amount

      this.editing = true
    }
  },

  methods: {
    ...mapActions([
      'loadTransactions',
      'loadCategories',
      'loadAccounts',
      'loadBudgets',
      'createBusiness',
      'createTransaction',
      'updateTransaction',
      'deleteTransaction',
      'loadBusinesses',
      'deleteBusiness'
    ]),

    processSave () {
      console.log('this.value: ', this.value)
      console.log('this.editing: ', this.editing)
      if (this.editing) {
        // TODO:
        // surely

        this.updateTransaction({
          account: this.transaction.account.id,
          amount: this.transaction.amount,
          business: this.transaction.business.id,
          budget: this.transaction.budget,
          category: this.transaction.category.id,
          date: this.transaction.date,
          note: this.transaction.note,
          id: this.transaction.id
        }).then(() => {
          this.$emit('updated-transaction', this.transaction)
        })
      } else {
        this.createTransaction({
          account: this.transaction.account.id,
          amount: this.transaction.amount,
          business: this.transaction.business.id,
          category: this.transaction.category.id,
          note: this.transaction.note,
          date: this.transaction.date
        }).then(() => {
          this.transaction = {}
        })
      }
    },

    updateSelection (name, obj) {
      this.$set(this.transaction, name, obj)
    },

    handleCreateBusiness (business) {
      let newBusiness = { name: business }
      this.createBusiness(newBusiness).then((val) => {
        this.updateSelection('business', val)
      })
    }
  },

  computed: {
    ...mapGetters([
      'getCategoryById',
      'getAccountById',
      'getCategorySelectList',
      'getAccountSelectList',
      'getBusinessSelectList',
      'getBusinessById'
    ])
  },

  watch: {
    credit: function (val) {
      this.transaction.amount = Math.abs(val)
    },

    debit: function (val) {
      this.transaction.amount = -Math.abs(val)
    }
  }
}
</script>
