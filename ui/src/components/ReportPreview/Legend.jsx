import React from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

import { getLegendEntries } from 'components/Report/Legend'
import LegendElement from './LegendElement'

const Legend = ({ barrierType, name }) => {
  const entries = getLegendEntries({ barrierType, name })

  return (
    <Box
      sx={{
        fontSize: 1,
        '> div + div': {
          mt: '0.5em',
        },
      }}
    >
      {entries.map((entry, i) => (
        <LegendElement
          key={entry.label}
          sx={{ fontWeight: i === 0 ? 'bold' : 'inherit' }}
          {...entry}
        />
      ))}
    </Box>
  )
}

Legend.propTypes = {
  barrierType: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
}

export default Legend
