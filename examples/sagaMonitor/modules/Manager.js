/** The manager is used for bookkeeping all the effect descriptors */
export default class Manager {
  constructor() {
    this.rootIds = []
    // effect-id-to-effect-descriptor
    this.map = {}
    // effect-id-to-array-of-child-id
    this.childIdsMap = {}
  }

  get(effectId) {
    return this.map[effectId]
  }

  set(effectId, desc) {
    this.map[effectId] = desc

    if (this.childIdsMap[desc.parentEffectId] == null) {
      this.childIdsMap[desc.parentEffectId] = []
    }
    this.childIdsMap[desc.parentEffectId].push(effectId)
  }

  setAsRoot(effectId) {
    this.rootIds.push(effectId)
  }

  getRootIds() {
    return this.rootIds
  }

  getChildIds(parentEffectId) {
    return this.childIdsMap[parentEffectId] || []
  }
}
