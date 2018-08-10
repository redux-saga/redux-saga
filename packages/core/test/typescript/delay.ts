import {delay} from "redux-saga/utils";

function testDelay() {
  delay(1).then(res => {
    // typings:expect-error
    const e: string = res;
    const r: boolean = res;
  });
}
