//
// Styles
//
import 'normalize.css/normalize.css';
import './index.css';
import { XStyleFactoryRegistry } from 'react-mental';
import { css } from 'glamor';
XStyleFactoryRegistry.registerFactory({
    createStyle: styles => {
        return css(styles).toString();
    },
});

css.global('html', {
    fontFamily: '"-apple-system",BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"'
});

//
// React
//

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AnimationTestPage } from './AnimationTestPage';

//
// Render
//

ReactDOM.render(
    <AnimationTestPage />,
    document.getElementById('root'),
)