export const capabilities = {
    workletSupported: !!window && ('animationWorklet' in CSS),
    waapiSupported: !!window && ('animate' in document.createElement('div'))
};