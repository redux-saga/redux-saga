import {delay} from "redux-saga";

function testDelay() {
  delay(1).then(res => {
    // typings:expect-error
    const e: string = res;
    const r: boolean = res;
  });

  delay(1, 'foo').then(res => {
    // typings:expect-error
    const e: boolean = res;
    const r: string = res;
  });
}
