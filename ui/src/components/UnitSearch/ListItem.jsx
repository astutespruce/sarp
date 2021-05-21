import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Text } from 'theme-ui'

import { STATE_FIPS } from '../../../config/constants'

const PREFIXES = {
  ECO3: 'Level 3',
  ECO4: 'Level 4',
}

const ListItem = ({ id, name, state, layer, showID, onClick }) => {
  const stateLabels = state
    ? state
        .split(',')
        .map((s) => STATE_FIPS[s])
        .sort()
        .join(', ')
    : ''

  return (
    <Box
      as="li"
      onClick={onClick}
      sx={{
        p: '0.5em',
        m: '0px',
        borderBottom: '1px solid #EEE',
        cursor: 'pointer',
        lineHeight: 1.2,
        '&:hover': {
          bg: 'grey.0',
        },
      }}
    >
      <b>{name}</b>
      {showID && (
        <Text
          sx={{
            display: 'inline-block',
            ml: '0.5em',
            fontSize: 0,
            color: 'grey.7',
            whiteSpace: 'nowrap',
            wordWrap: 'none',
          }}
        >
          ({layer && `${PREFIXES[layer] || layer}: `}
          {id})
        </Text>
      )}

      {stateLabels && (
        <Text sx={{ fontSize: 1, color: 'grey.7' }}>{stateLabels}</Text>
      )}
    </Box>
  )
}

ListItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  state: PropTypes.string,
  layer: PropTypes.string,
  showID: PropTypes.bool,
}

ListItem.defaultProps = {
  state: '',
  layer: '',
  showID: false,
}

export default memo(ListItem)
