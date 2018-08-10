/** The manager is used for bookkeeping all the effect descriptors */
export default class Manager {
  constructor() {
    this.rootIds = []
    // effect-id-to-effect-descriptor
    this.map = {}
  }

  get(effectId) {
    return this.map[effectId]
  }

  set(effectId, desc) {
    this.map[effectId] = desc
  }

  setAsRoot(effectId) {
    this.rootIds.push(effectId)
  }

  getRootIds() {
    return this.rootIds
  }

  getChildIds(parentEffectId) {
    return Object.keys(this.map)
      .filter(effectId => this.map[effectId].parentEffectId === parentEffectId)
      .map(Number)
  }
}
