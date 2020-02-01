import * as React from 'react';

interface FastAnimatedContainerProps {
    className?: string;
    mode?: 'adaptive' | 'css-property' | 'web-animations';
    children?: any;
    easing?: string;
    duration?: number;
    translateX?: number;
    translateY?: number;
}

export const FastAnimatedContainer = React.memo((props: FastAnimatedContainerProps) => {

    // Resolve Mode
    let mode: 'css-property' | 'web-animations' = 'css-property';
    if (props.mode === 'web-animations') {
        mode = 'web-animations';
    }
    if (!props.mode || props.mode === 'adaptive') {
        const isChrome = window && !!(window as any).chrome && (!!(window as any).chrome.webstore || !!(window as any).chrome.runtime);
        if (isChrome) {
            // For chrome we need to use Web Animations API
            mode = 'web-animations';
        } else {
            // For anything else we are ok to use css property animations
            mode = 'css-property';
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
    if (mode === 'web-animations') {

        let ref = React.useRef<HTMLDivElement>(null);
        let initialX = React.useMemo(() => props.translateX || 0, []);
        let initialY = React.useMemo(() => props.translateY || 0, []);
        let currentX = React.useRef(initialX);
        let currentY = React.useRef(initialY);

        React.useLayoutEffect(() => {
            let tx = props.translateX || 0;
            let ty = props.translateY || 0;
            if (currentX.current !== tx || currentY.current !== ty) {
                ref.current!.animate([
                    {
                        transform: `translate(${currentX.current}px,${currentY.current}px)`
                    }, {
                        transform: `translate(${tx}px,${ty}px)`
                    }
                ], { duration: duration, fill: 'forwards', easing: easing });

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
                    transform: `translate(${initialX}px,${initialY}px)`,
                }}
            >
                {props.children}
            </div>
        );
    }

    // Css Property Animations Implementation
    if (mode === 'css-property') {
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
    }

    throw Error('Unknown animation mode: ' + mode);
});