import { getAddresses, createAddress, updateAddress, deleteAddress } from '/api.js'

export const addressBook = () => ({
  addresses: [],
  loading: false,
  saving: false,
  formOpen: false,
  editingId: null,
  errors: {},
  form: {
    recipientName: '',
    phone: '',
    country: '中国',
    province: '',
    city: '',
    district: '',
    addressLine1: '',
    postalCode: '',
    isDefault: false,
  },

  resetForm() {
    this.editingId = null
    this.errors = {}
    this.form = {
      recipientName: '', phone: '', country: '中国', province: '', city: '', district: '',
      addressLine1: '', postalCode: '', isDefault: false,
    }
  },

  openAdd() {
    this.resetForm()
    this.formOpen = true
  },

  openEdit(addr) {
    this.editingId = addr.id
    this.errors = {}
    this.form = {
      recipientName: addr.recipientName,
      phone: addr.phone,
      country: addr.country || '中国',
      province: addr.province,
      city: addr.city,
      district: addr.district,
      addressLine1: addr.addressLine1,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault,
    }
    this.formOpen = true
  },

  closeForm() {
    this.formOpen = false
    this.resetForm()
  },

  validate() {
    this.errors = {}
    const required = ['recipientName', 'phone', 'province', 'city', 'district', 'addressLine1']
    for (const key of required) {
      if (!this.form[key]?.trim()) this.errors[key] = '此项为必填'
    }
    return Object.keys(this.errors).length === 0
  },

  async loadAddresses(walletAddress) {
    if (!walletAddress) return
    this.loading = true
    try {
      this.addresses = await getAddresses(walletAddress)
    } catch (e) {
      console.error('loadAddresses:', e)
      Alpine.notify.error('加载地址失败')
    } finally {
      this.loading = false
    }
  },

  async saveAddress(walletAddress) {
    if (!this.validate()) return false
    this.saving = true
    try {
      const payload = { address: walletAddress, ...this.form }
      if (this.editingId) {
        await updateAddress(this.editingId, payload)
        Alpine.notify.success('地址已更新')
      } else {
        await createAddress(payload)
        Alpine.notify.success('地址已添加')
      }
      await this.loadAddresses(walletAddress)
      window.dispatchEvent(new CustomEvent('address-book-saved', { detail: { addresses: this.addresses } }))
      this.closeForm()
      return true
    } catch (e) {
      Alpine.notify.error(e.message || '保存地址失败')
      return false
    } finally {
      this.saving = false
    }
  },

  async removeAddress(id, walletAddress) {
    if (!confirm('确定删除该收货地址吗？')) return
    try {
      await deleteAddress(id, walletAddress)
      Alpine.notify.success('地址已删除')
      await this.loadAddresses(walletAddress)
      window.dispatchEvent(new CustomEvent('address-book-saved', { detail: { addresses: this.addresses } }))
    } catch (e) {
      Alpine.notify.error(e.message || '删除地址失败')
    }
  },

  async setDefault(id, walletAddress) {
    try {
      const addr = this.addresses.find(a => a.id === id)
      if (!addr) return
      await updateAddress(id, { ...addr, address: walletAddress, isDefault: true })
      Alpine.notify.success('默认地址已更新')
      await this.loadAddresses(walletAddress)
      window.dispatchEvent(new CustomEvent('address-book-saved', { detail: { addresses: this.addresses } }))
    } catch (e) {
      Alpine.notify.error(e.message || '设置失败')
    }
  },

  getDefaultAddress() {
    return this.addresses.find(a => a.isDefault) || this.addresses[0] || null
  },
})
