import * as React from 'react';
import { css, keyframes } from 'glamor';
import { capabilities } from './capabilities';

const passthroughWorklet = `
registerAnimator('passthrough', class {
    animate(currentTime, effect) {
        effect.localTime = currentTime;
    }
});
`

let workletEnabled = false;
if (capabilities.workletSupported) {
    (CSS as any).animationWorklet.addModule(
        URL.createObjectURL(new Blob([passthroughWorklet], { type: "text/javascript" }))
    ).then(function () {
        workletEnabled = true;
    });
}

// Stylesheet
let styleElement: HTMLStyleElement;
function getStyleSheet() {
    if (styleElement) {
        return styleElement.sheet! as CSSStyleSheet;
    }
    styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    return styleElement.sheet! as CSSStyleSheet;
}

const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function randomKey() {
    let r = '';
    for (let i = 0; i < 10; i++) {
        r += letters[Math.floor(Math.random() * (letters.length - 1))];
    }
    return r;
}

let keyframesCache = new Map<string, string>();
function getKeyframes(fromX: number, fromY: number, toX: number, toY: number) {
    let key = `kf-${fromX}-${fromY}-${toX}-${toY}`;
    if (keyframesCache.has(key)) {
        return keyframesCache.get(key)!;
    }
    let id = 'fa-kf-' + randomKey();
    let styleSheet = getStyleSheet();
    let rule = `
        @keyframes ${id} {
            from { transform: translate(${fromX}px,${fromY}px); }
            to { transform: translate(${toX}px,${toY}px); }
        }
    `;
    styleSheet.insertRule(rule, styleSheet.cssRules.length);
    keyframesCache.set(key, id);
    return id;
}

export interface FastAnimatedContainerProps {
    className?: string;
    mode?: 'adaptive' | 'css-property' | 'css-animations' | 'web-animations' | 'animation-worklet';
    children?: any;
    easing?: string;
    duration?: number;
    translateX?: number;
    translateY?: number;
}

export const FastAnimatedContainer = React.memo((props: FastAnimatedContainerProps) => {

    // Resolve Mode
    let mode: 'css-property' | 'web-animations' | 'animation-worklet' | 'css-animations' = 'css-property';
    if (props.mode === 'web-animations') {
        mode = 'web-animations';
    }
    if (props.mode === 'animation-worklet') {
        mode = 'animation-worklet';
    }
    if (props.mode === 'css-animations') {
        mode = 'css-animations';
    }
    if (!props.mode || props.mode === 'adaptive') {
        if (capabilities.workletSupported) {
            mode = 'animation-worklet';
        } else {
            const isChrome = window && !!(window as any).chrome && (!!(window as any).chrome.webstore || !!(window as any).chrome.runtime);
            if (isChrome) {
                // For chrome we need to use CSS animations
                mode = 'css-animations';
            } else {
                // For anything else we are ok to use css property animations
                mode = 'css-property';
            }
        }
    }
    let savedMode = React.useMemo(() => mode, []);
    if (savedMode !== mode) {
        throw Error('Animation mode can\'t be changed');
    }

    // Resolve Easing
    let easing = props.easing || 'cubic-bezier(.29, .09, .24, .99)';
    let duration = props.duration || 240;

    // Web Animations Implementation
    if ((mode === 'web-animations' && capabilities.waapiSupported)
        || (mode === 'animation-worklet' && capabilities.workletSupported)) {
        let ref = React.useRef<HTMLDivElement>(null);
        let initialX = React.useMemo(() => props.translateX || 0, []);
        let initialY = React.useMemo(() => props.translateY || 0, []);
        let currentX = React.useRef(initialX);
        let currentY = React.useRef(initialY);

        React.useLayoutEffect(() => {
            let tx = props.translateX || 0;
            let ty = props.translateY || 0;
            if (currentX.current !== tx || currentY.current !== ty) {
                if (mode === 'animation-worklet' && capabilities.workletSupported && workletEnabled) {
                    console.warn('Experimental Worklet Animation');
                    new (window as any).WorkletAnimation(
                        'passthrough',
                        new KeyframeEffect(
                            ref.current!,
                            [
                                {
                                    transform: `translate(${currentX.current}px,${currentY.current}px)`
                                }, {
                                    transform: `translate(${tx}px,${ty}px)`
                                }
                            ],
                            {
                                duration: duration,
                                easing: easing,
                                fill: 'forwards'
                            }
                        ),
                        document.timeline
                    ).play();
                } else {
                    ref.current!.animate([
                        {
                            transform: `translate(${currentX.current}px,${currentY.current}px)`
                        }, {
                            transform: `translate(${tx}px,${ty}px)`
                        }
                    ], { duration: duration, fill: 'forwards', easing: easing });
                }

                currentX.current = tx;
                currentY.current = ty;
            }
        }, [props.translateX, props.translateY]);

        return (
            <div
                ref={ref}
                className={props.className}
                style={{
                    willChange: 'transform',
                    transform: `translate(${initialX}px,${initialY}px)`
                }}
            >
                {props.children}
            </div>
        );
    }

    if (mode === 'css-animations') {
        let ref = React.useRef<HTMLDivElement>(null);
        let tx = props.translateX || 0;
        let ty = props.translateY || 0;
        let initialX = React.useMemo(() => tx, []);
        let initialY = React.useMemo(() => ty, []);
        let currentX = React.useRef(initialX);
        let currentY = React.useRef(initialY);

        // Calculate Animation
        let aniamtionKf = React.useRef<string | undefined>(undefined);
        if (currentX.current !== tx || currentY.current !== ty) {
            let kf = getKeyframes(currentX.current, currentY.current, tx, ty);
            aniamtionKf.current = kf;
            currentX.current = tx;
            currentY.current = ty;
        }

        return (
            <div
                ref={ref}
                className={props.className}
                style={{
                    animation: aniamtionKf.current ? `${aniamtionKf.current} ${duration}ms ${easing} forwards` : undefined,
                    willChange: 'transform',
                    transform: `translate(${initialX}px,${initialY}px)`
                }}
            >
                {props.children}
            </div>
        );
    }

    // Css Property Animations Implementation
    return (
        <div
            style={{
                willChange: 'transform',
                transition: 'transform ' + duration + 'ms ' + easing,
                transform: `translate(${props.translateX || 0}px,${props.translateY || 0}px)`,
            }}
        >
            {props.children}
        </div>
    );
});