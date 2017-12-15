function* withEffectObjectProps(){
    yield race({
        timeout: delay(3000),
        cannelled: take('CANCELLED')
    })
}
