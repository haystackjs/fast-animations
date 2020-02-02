const hasDom = !!(typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement);

export const capabilities = {
    workletSupported: hasDom && ('animationWorklet' in CSS),
    waapiSupported: hasDom && ('animate' in document.createElement('div'))
};