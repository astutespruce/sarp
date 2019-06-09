import React from 'react'
import PropTypes from 'prop-types'

import SEO from 'components/SEO'
import { Flex } from 'components/Grid'
import styled, { ThemeProvider, theme } from 'style'
import { isUnsupported } from 'util/dom'
import UnsupportedBrowser from './UnsupportedBrowser'
import Header from './Header'
import Footer from './Footer'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Content = styled.div`
  flex: 1 1 auto;
`

const Layout = ({ children, title }) => {
  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <SEO title={title} />
        <Header siteTitle={title} />

        {isUnsupported ? <UnsupportedBrowser /> : <Content>{children}</Content>}

        <Footer />
      </Wrapper>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
}

Layout.defaultProps = {
  title: '',
}

export default Layout
