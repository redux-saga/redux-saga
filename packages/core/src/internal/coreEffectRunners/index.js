import * as effectTypes from '../effectTypes'
import all from './all'
import race from './race'
import select from './select'
import take from './take'
import put from './put'
import call from './call'
import cps from './cps'
import fork from './fork'
import join from './join'
import cancel from './cancel'
import actionChannel from './actionChannel'
import flush from './flush'
import cancelled from './cancelled'
import getContext from './getContext'
import setContext from './setContext'

const coreEffectRunnerMap = {
  [effectTypes.TAKE]: take,
  [effectTypes.PUT]: put,
  [effectTypes.ALL]: all,
  [effectTypes.RACE]: race,
  [effectTypes.CALL]: call,
  [effectTypes.CPS]: cps,
  [effectTypes.FORK]: fork,
  [effectTypes.JOIN]: join,
  [effectTypes.CANCEL]: cancel,
  [effectTypes.SELECT]: select,
  [effectTypes.ACTION_CHANNEL]: actionChannel,
  [effectTypes.CANCELLED]: cancelled,
  [effectTypes.FLUSH]: flush,
  [effectTypes.GET_CONTEXT]: getContext,
  [effectTypes.SET_CONTEXT]: setContext,
}

export default coreEffectRunnerMap
