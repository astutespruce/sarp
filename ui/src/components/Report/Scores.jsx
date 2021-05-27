/* eslint-disable camelcase */
import React from 'react'
import PropTypes from 'prop-types'
import { Text, View } from '@react-pdf/renderer'

import { Bold, Italic, List, ListItem } from './elements'

const Scores = ({
  barrierType,
  hasnetwork,
  excluded,
  se_nc_tier,
  se_wc_tier,
  se_ncwc_tier,
  state_nc_tier,
  state_wc_tier,
  state_ncwc_tier,
}) => {
  const typeLabel = barrierType === 'dams' ? 'dam' : 'road-related barrier'
  return (
    <List
      title="Connectivity ranks"
      note="Tiers range from 20 (lowest) to 1 (highest)."
    >
      <View style={{ marginTop: 12 }} />
      {hasnetwork ? (
        <View>
          <Italic>State ranks</Italic>
          <ListItem>
            <Text>
              Network connectivity tier: <Bold>{state_nc_tier}</Bold>
            </Text>
          </ListItem>
          <ListItem>
            <Text>
              Watershed condition tier: <Bold>{state_wc_tier}</Bold>
            </Text>
          </ListItem>
          <ListItem>
            <Text>
              Network connectivity & watershed condition tier:{' '}
              <Bold>{state_ncwc_tier}</Bold>
            </Text>
          </ListItem>

          <Italic style={{ marginTop: 12 }}>Southeast ranks</Italic>
          <ListItem>
            <Text>
              Network connectivity tier: <Bold>{se_nc_tier}</Bold>
            </Text>
          </ListItem>
          <ListItem>
            <Text>
              Watershed condition tier: <Bold>{se_wc_tier}</Bold>
            </Text>
          </ListItem>
          <ListItem>
            <Text>
              Network connectivity & watershed condition tier:{' '}
              <Bold>{se_ncwc_tier}</Bold>
            </Text>
          </ListItem>
        </View>
      ) : (
        <Text style={{ color: '#7f8a93' }}>
          {excluded
            ? `This ${typeLabel} was excluded from the connectivity analysis based on field reconnaissance or manual review of aerial imagery.`
            : `This ${typeLabel} is off-network and has no functional network information.`}
        </Text>
      )}
    </List>
  )
}
Scores.propTypes = {
  barrierType: PropTypes.string.isRequired,
  hasnetwork: PropTypes.bool,
  excluded: PropTypes.bool,
  se_nc_tier: PropTypes.number,
  se_wc_tier: PropTypes.number,
  se_ncwc_tier: PropTypes.number,
  state_nc_tier: PropTypes.number,
  state_wc_tier: PropTypes.number,
  state_ncwc_tier: PropTypes.number,
}

Scores.defaultProps = {
  hasnetwork: false,
  excluded: false,
  se_nc_tier: null,
  se_wc_tier: null,
  se_ncwc_tier: null,
  state_nc_tier: null,
  state_wc_tier: null,
  state_ncwc_tier: null,
}

export default Scores
