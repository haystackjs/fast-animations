import * as React from 'react';

interface FastAnimatedContainerProps {
    className?: string;
    mode?: 'adaptive' | 'css-property' | 'web-animations' | 'animation-worklet';
    children?: any;
    easing?: string;
    duration?: number;
    translateX?: number;
    translateY?: number;
}

export const FastAnimatedContainer = React.memo((props: FastAnimatedContainerProps) => {

    // Resolve Mode
    let mode: 'css-property' | 'web-animations' | 'animation-worklet' = 'css-property';
    if (props.mode === 'web-animations') {
        mode = 'web-animations';
    }
    if (props.mode === 'animation-worklet') {
        mode = 'animation-worklet';
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
                    transform: `translate(${initialX}px,${initialY}px)`
                }}
            >
                {props.children}
            </div>
        );
    }

    // Worklet Animations
    if (mode === 'animation-worklet') {

        React.useLayoutEffect(() => {

            function urlFromTag(sel: any) {
                const el = document.querySelector(sel);
                if (!el) {
                    throw new Error("Couldn’t find element");
                }
                const blob = new Blob([el.textContent], { type: "text/javascript" });
                return URL.createObjectURL(blob);
            }

            (CSS as any).animationWorklet.addModule(urlFromTag("script[language='javascript+animationworklet']")).then(function () {
                // we can use the animator here
            });

            // (registerAnimator as any)('passthrough', class {
            //     animate(currentTime, effect) {
            //         effect.localTime = currentTime;
            //     }
            // });

        }, []);

        let ref = React.useRef<HTMLDivElement>(null);
        let initialX = React.useMemo(() => props.translateX || 0, []);
        let initialY = React.useMemo(() => props.translateY || 0, []);
        let currentX = React.useRef(initialX);
        let currentY = React.useRef(initialY);

        React.useLayoutEffect(() => {
            let tx = props.translateX || 0;
            let ty = props.translateY || 0;
            if (currentX.current !== tx || currentY.current !== ty) {

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

                // ref.current!.animate([
                //     {
                //         transform: `translate(${currentX.current}px,${currentY.current}px)`
                //     }, {
                //         transform: `translate(${tx}px,${ty}px)`
                //     }
                // ], { duration: duration, fill: 'forwards', easing: easing, iterations: Number.POSITIVE_INFINITY });

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