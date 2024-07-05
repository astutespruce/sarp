import React from 'react'
import PropTypes from 'prop-types'
import { Text, View } from '@react-pdf/renderer'

import { formatNumber } from 'util/format'

import { Bold, Flex, Section } from './elements'

const MainstemNetworkInfo = ({
  barrierType,
  networkType,
  totalupstreammainstemmiles,
  perennialupstreammainstemmiles,
  alteredupstreammainstemmiles,
  unalteredupstreammainstemmiles,
  freelineardownstreammiles,
  freeperenniallineardownstreammiles,
  freealteredlineardownstreammiles,
  freeunalteredlineardownstreammiles,
  removed,
  flowstoocean,
  flowstogreatlakes,
  totaldownstreamdams,
  totaldownstreamsmallbarriers,
  totaldownstreamwaterfalls,
  ...props
}) => {
  const barrierTypeLabel =
    barrierType === 'dams' ? 'dam' : 'road-related barrier'

  const totaldownstreambarriers =
    networkType === 'dams'
      ? totaldownstreamdams + totaldownstreamwaterfalls
      : totaldownstreamdams +
        totaldownstreamwaterfalls +
        totaldownstreamsmallbarriers

  const alwaysUseUpstream =
    (flowstoocean === 1 || flowstogreatlakes === 1) &&
    totaldownstreambarriers === 0

  const mainstemGainMiles = Math.min(
    totalupstreammainstemmiles,
    freelineardownstreammiles
  )
  const mainstemGainMilesSide =
    alwaysUseUpstream || mainstemGainMiles === totalupstreammainstemmiles
      ? 'upstream'
      : 'downstream'

  const perennialMainstemGainMiles = Math.min(
    perennialupstreammainstemmiles,
    freeperenniallineardownstreammiles
  )
  const perennialMainstemGainMilesSide =
    alwaysUseUpstream ||
    perennialMainstemGainMiles === perennialupstreammainstemmiles
      ? 'upstream'
      : 'downstream'

  const intermittentupstreammainstemmiles =
    totalupstreammainstemmiles - perennialupstreammainstemmiles
  const freeintermittentlineardownstreammiles =
    freelineardownstreammiles - freeperenniallineardownstreammiles

  return (
    <Section
      title="Mainstem network information"
      {...props}
      wrap={false}
      marginBottom={6}
    >
      <Text
        style={{
          color: '#7f8a93',
          fontSize: 10,
          marginBottom: '6pt',
        }}
      >
        Upstream mainstem networks include the stream reaches upstream that are
        the same stream order as the one associated with this barrier (excludes
        smaller tributaries) with at least 1 square mile of drainage area.
        Downstream mainstem networks are based on the linear flow direction
        network from this barrier to the next barrier downstream or
        downstream-most point on that network (does not include any
        tributaries).
      </Text>

      <View style={{ marginTop: 36 }}>
        <Flex>
          <View style={{ flex: '1 1 auto' }} />
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              <Bold>upstream network</Bold>
            </Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              <Bold>downstream network</Bold>
            </Text>
          </View>
        </Flex>

        <Flex
          style={{
            borderTop: '1px solid #dee1e3',
            marginTop: 6,
            paddingTop: 6,
          }}
        >
          <View style={{ flex: '1 1 auto' }}>
            <Text>Total miles</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {mainstemGainMilesSide === 'upstream' ? (
                <Bold>{formatNumber(totalupstreammainstemmiles, 2, true)}</Bold>
              ) : (
                <>{formatNumber(totalupstreammainstemmiles, 2, true)}</>
              )}
            </Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {mainstemGainMilesSide === 'downstream' ? (
                <>
                  <Bold>
                    {formatNumber(freelineardownstreammiles, 2, true)}
                  </Bold>
                </>
              ) : (
                <>{formatNumber(freelineardownstreammiles, 2, true)}</>
              )}
            </Text>
          </View>
        </Flex>

        <Flex
          style={{
            borderTop: '1px solid #dee1e3',
            marginTop: 6,
            paddingTop: 6,
          }}
        >
          <View style={{ flex: '1 1 auto' }}>
            <Text>Perennial miles</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {perennialMainstemGainMilesSide === 'upstream' ? (
                <>
                  <Bold>
                    {formatNumber(perennialupstreammainstemmiles, 2, true)}
                  </Bold>
                </>
              ) : (
                <>{formatNumber(perennialupstreammainstemmiles, 2, true)}</>
              )}
            </Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {perennialMainstemGainMilesSide === 'downstream' ? (
                <Bold>
                  {formatNumber(freeperenniallineardownstreammiles, 2, true)}
                </Bold>
              ) : (
                <>{formatNumber(freeperenniallineardownstreammiles, 2, true)}</>
              )}
            </Text>
          </View>
        </Flex>

        <Flex
          style={{
            borderTop: '1px solid #dee1e3',
            marginTop: 6,
            paddingTop: 6,
          }}
        >
          <View style={{ flex: '1 1 auto' }}>
            <Text>Ephemeral / intermittent miles</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {formatNumber(intermittentupstreammainstemmiles, 2, true)}
            </Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {formatNumber(freeintermittentlineardownstreammiles, 2, true)}
            </Text>
          </View>
        </Flex>

        <Flex
          style={{
            borderTop: '1px solid #dee1e3',
            marginTop: 6,
            paddingTop: 6,
          }}
        >
          <View style={{ flex: '1 1 auto' }}>
            <Text>Altered miles</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>{formatNumber(alteredupstreammainstemmiles, 2, true)}</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {formatNumber(freealteredlineardownstreammiles, 2, true)}
            </Text>
          </View>
        </Flex>

        <Flex
          style={{
            borderTop: '1px solid #dee1e3',
            marginTop: 6,
            paddingTop: 6,
          }}
        >
          <View style={{ flex: '1 1 auto' }}>
            <Text>Unaltered miles</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>{formatNumber(unalteredupstreammainstemmiles, 2, true)}</Text>
          </View>
          <View style={{ flex: '0 0 140pt' }}>
            <Text>
              {formatNumber(freeunalteredlineardownstreammiles, 2, true)}
            </Text>
          </View>
        </Flex>

        {alwaysUseUpstream ? (
          <Text style={{ color: '#7f8a93', marginTop: 28, fontSize: 10 }}>
            Note: upstream miles are used because the downstream network flows
            into the {flowstogreatlakes === 1 ? 'Great Lakes' : 'ocean'} and
            there are no barriers downstream.
          </Text>
        ) : null}

        <Text
          style={{
            color: '#7f8a93',
            marginTop: alwaysUseUpstream ? 14 : 28,
            fontSize: 10,
          }}
        >
          Note: statistics are based on aquatic networks cut by{' '}
          {networkType === 'dams'
            ? 'waterfalls and dams'
            : 'waterfalls, dams, and road-related barriers'}
          {networkType === 'largefish_barriers'
            ? ' based on their passability for large-bodied fish'
            : null}
          {networkType === 'smallfish_barriers'
            ? ' based on their passability for small-bodied fish'
            : null}
          {removed
            ? `, including any that were present at the time this ${barrierTypeLabel} was removed, with the exception of those directly upstream that were removed in the same year as this barrier. All barriers removed prior to 2000 or where the year they were removed was unknown were lumped together for this analysis`
            : null}
          .
        </Text>
      </View>
    </Section>
  )
}

MainstemNetworkInfo.propTypes = {
  barrierType: PropTypes.string.isRequired,
  networkType: PropTypes.string.isRequired,
  totalupstreammainstemmiles: PropTypes.number,
  perennialupstreammainstemmiles: PropTypes.number,
  alteredupstreammainstemmiles: PropTypes.number,
  unalteredupstreammainstemmiles: PropTypes.number,
  freelineardownstreammiles: PropTypes.number,
  freeperenniallineardownstreammiles: PropTypes.number,
  freealteredlineardownstreammiles: PropTypes.number,
  freeunalteredlineardownstreammiles: PropTypes.number,
  removed: PropTypes.bool,
  flowstoocean: PropTypes.number,
  flowstogreatlakes: PropTypes.number,
  totaldownstreamdams: PropTypes.number,
  totaldownstreamsmallbarriers: PropTypes.number,
  totaldownstreamwaterfalls: PropTypes.number,
}

MainstemNetworkInfo.defaultProps = {
  totalupstreammainstemmiles: 0,
  perennialupstreammainstemmiles: 0,
  alteredupstreammainstemmiles: 0,
  unalteredupstreammainstemmiles: 0,
  freelineardownstreammiles: 0,
  freeperenniallineardownstreammiles: 0,
  freealteredlineardownstreammiles: 0,
  freeunalteredlineardownstreammiles: 0,
  removed: false,
  flowstoocean: 0,
  flowstogreatlakes: 0,
  totaldownstreamdams: 0,
  totaldownstreamsmallbarriers: 0,
  totaldownstreamwaterfalls: 0,
}

export default MainstemNetworkInfo
