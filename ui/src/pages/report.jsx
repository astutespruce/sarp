import React from 'react'
/* eslint-disable-next-line import/no-unresolved */
import { Router } from '@reach/router'

import { ClientOnly, SEO } from 'components/Layout'
import { BarrierReport } from 'views'

const DynamicRouter = () => (
  <ClientOnly>
    <Router style={{ height: '100%' }}>
      <BarrierReport path="/report/:barrierType/:sarpid" />
    </Router>
  </ClientOnly>
)

export default DynamicRouter

export const Head = () => <SEO title="Download a Report" />
