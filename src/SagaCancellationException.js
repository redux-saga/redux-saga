
/**
* Creates an instance of a cancellation error
* used internally by the Library to handle Cancellations effects
* params:
*    type: PARALLEL_AUTO_CANCEL | RACE_AUTO_CANCEL | MANUAL_CANCEL
*    saga: current saga where the cancellation is to be thrown
*    origin: Origin saga from which the cancellation originated
*/

export default function SagaCancellationException(type, saga, origin) {
  const message = `SagaCancellationException; type: ${type}, saga: ${saga}, origin: ${origin}`

  this.name = 'SagaCancellationException'
  this.message = message
  this.type = type
  this.saga = saga
  this.origin = origin
  this.stack = (new Error()).stack;

}
SagaCancellationException.prototype = Object.create(Error.prototype);
SagaCancellationException.prototype.constructor = SagaCancellationException;
