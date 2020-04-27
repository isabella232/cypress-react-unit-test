import * as React from 'react'
import ReactDOM, { unmountComponentAtNode } from 'react-dom'
import getDisplayName from './getDisplayName'
import { injectStylesBeforeElement } from './utils'

const rootId = 'cypress-root'

function checkMountModeEnabled() {
  // @ts-ignore
  if (Cypress.spec.specType !== 'component') {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in component folder`,
    )
  }
}

/**
 * Inject custom style text or CSS file or 3rd party style resources
 */
const injectStyles = (options: MountOptions) => () => {
  const document = cy.state('document')
  const el = document.getElementById(rootId)
  return injectStylesBeforeElement(options, document, el)
}

/**
 * Mount a React component in a blank document; register it as an alias
 * To access: use an alias or original component reference
 *  @function   cy.mount
 *  @param      {React.ReactElement}  jsx - component to mount
 *  @param      {string}  [Component] - alias to use later
 *  @example
 ```
 import Hello from './hello.jsx'
 // mount and access by alias
 cy.mount(<Hello />, 'Hello')
 // using default alias
 cy.get('@Component')
 // using original component
 cy.get(Hello)
 ```
 **/
export const mount = (jsx: React.ReactElement, options: MountOptions = {}) => {
  checkMountModeEnabled()

  // Get the display name property via the component constructor
  // @ts-ignore FIXME
  const displayname = getDisplayName(jsx.type, options.alias)

  return cy
    .then(() => {
      if (options.log !== false) {
        Cypress.log({
          name: 'mount',
          message: [`ReactDOM.render(<${displayname} ... />)`],
          consoleProps() {
            return {
              props: jsx.props,
            }
          },
        })
      }
    })
    .then(injectStyles(options))
    .then(() => {
      const document = cy.state('document')
      const reactDomToUse = options.ReactDom || ReactDOM

      const el = document.getElementById(rootId)

      const key =
        // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
        (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
      const props = {
        key,
      }

      const CypressTestComponent = reactDomToUse.render(
        React.createElement(React.Fragment, props, jsx),
        el,
      )

      cy.wrap(CypressTestComponent, { log: false }).as(
        options.alias || displayname,
      )
    })
}

/**
 * Removes any mounted component
 */
export const unmount = () => {
  checkMountModeEnabled()

  cy.log('unmounting...')
  const selector = '#' + rootId
  return cy.get(selector, { log: false }).then($el => {
    unmountComponentAtNode($el[0])
  })
}

export default mount
