import React from 'react'
import PropTypes from 'prop-types'
import { Box, Paragraph, Text } from 'theme-ui'

import { OutboundLink } from 'components/Link'
import { formatNumber } from 'util/format'
import { isEmptyString } from 'util/string'

import { siteMetadata } from '../../../gatsby-config'
import {
  BARRIER_SEVERITY,
  OWNERTYPE,
  HUC8_USFS,
} from '../../../config/constants'

const { version: dataVersion } = siteMetadata

const BarrierDetails = ({
  sarpid,
  lat,
  lon,
  source,
  hasnetwork,
  excluded,
  stream,
  intermittent,
  HUC8,
  HUC12,
  HUC8Name,
  HUC12Name,
  road,
  roadtype,
  crossingtype,
  condition,
  tespp,
  statesgcnspp,
  regionalsgcnspp,
  ownertype,
  huc8_usfs,
  huc8_coa,
  huc8_sgcn,
  severityclass,
  // metrics
  freeupstreammiles,
  freedownstreammiles,
  totalupstreammiles,
  totaldownstreammiles,
  landcover,
  sizeclasses,
}) => {
  const isCrossing = isEmptyString(crossingtype)

  return (
    <Box
      sx={{
        '&>div+div': {
          mt: '0.5rem',
          pt: '0.5rem',
          borderTop: '1px solid',
          borderTopColor: 'grey.2',
        },
      }}
    >
      <Box>
        <Text sx={{ fontWeight: 'bold' }}>Location</Text>
        <Box as="ul" sx={{ mt: '0.5rem' }}>
          <li>
            Coordinates: {formatNumber(lat, 3)}
            &deg; N, {formatNumber(lon, 3)}
            &deg; E
          </li>
          {!isEmptyString(stream) ? <li>River or stream: {stream}</li> : null}
          {!isEmptyString(road) ? <li>Road: {road}</li> : null}

          {intermittent ? (
            <li>Located on a reach that has intermittent or ephemeral flow</li>
          ) : null}

          {HUC12Name ? (
            <li>
              {HUC12Name} Subwatershed{' '}
              <Paragraph variant="help">(HUC12: {HUC12})</Paragraph>
            </li>
          ) : null}

          {HUC8Name ? (
            <li>
              {HUC8Name} Subbasin{' '}
              <Paragraph variant="help">(HUC8: {HUC8})</Paragraph>
            </li>
          ) : null}

          {ownertype && ownertype > 0 && (
            <li>Conservation land type: {OWNERTYPE[ownertype]}</li>
          )}
        </Box>
      </Box>

      <Box>
        <Text sx={{ fontWeight: 'bold' }}>Barrier information</Text>
        <Box as="ul" sx={{ mt: '0.5rem' }}>
          <li>
            Barrier type:{' '}
            {isCrossing
              ? 'road / stream crossing'
              : 'road-related potential barrier'}
          </li>
          {!isEmptyString(roadtype) ? <li>Road type: {roadtype}</li> : null}
          {!isEmptyString(crossingtype) ? (
            <li>Crossing type: {crossingtype}</li>
          ) : null}
          {!isEmptyString(condition) ? <li>Condition: {condition}</li> : null}
          {severityclass !== null ? (
            <li>Severity: {BARRIER_SEVERITY[severityclass]}</li>
          ) : null}
        </Box>
      </Box>

      <Box>
        <Text sx={{ fontWeight: 'bold' }}>Functional network information</Text>
        <Box as="ul" sx={{ mt: '0.5rem' }}>
          {hasnetwork ? (
            <>
              <li>
                <b>
                  {formatNumber(
                    Math.min(totalupstreammiles, freedownstreammiles)
                  )}{' '}
                  miles
                </b>{' '}
                could be gained by removing this barrier.
                <Box as="ul" sx={{ mt: '0.5rem' }}>
                  <li>
                    {formatNumber(freeupstreammiles)} free-flowing miles
                    upstream
                    <ul>
                      <li>
                        <b>{formatNumber(totalupstreammiles)} total miles</b> in
                        the upstream network
                      </li>
                    </ul>
                  </li>

                  <li>
                    <b>
                      {formatNumber(freedownstreammiles)} free-flowing miles
                    </b>{' '}
                    in the downstream network
                    <ul>
                      <li>
                        {formatNumber(totaldownstreammiles)} total miles in the
                        downstream network
                      </li>
                    </ul>
                  </li>
                </Box>
              </li>
              <li>
                <b>{sizeclasses}</b> river size{' '}
                {sizeclasses === 1 ? 'class' : 'classes'} could be gained by
                removing this barrier
              </li>
              <li>
                <b>{formatNumber(landcover, 0)}%</b> of the upstream floodplain
                is composed of natural landcover
              </li>
            </>
          ) : (
            <>
              {excluded ? (
                <li>
                  This dam was excluded from the connectivity analysis based on
                  field reconnaissance or manual review of aerial imagery.
                </li>
              ) : (
                <>
                  {isCrossing ? (
                    <li>
                      This crossing has not yet been evaluated for aquatic
                      connectivity.
                    </li>
                  ) : (
                    <>
                      <li>
                        This barrier is off-network and has no functional
                        network information.
                      </li>
                      <Paragraph variant="help">
                        Not all barriers could be correctly snapped to the
                        aquatic network for analysis. Please contact us to
                        report an error or for assistance interpreting these
                        results.
                      </Paragraph>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>

      <Box>
        <Text sx={{ fontWeight: 'bold' }}>Species information</Text>
        <Box as="ul" sx={{ mt: '0.5rem' }}>
          {tespp > 0 ? (
            <>
              <li>
                <b>{tespp}</b> federally-listed threatened and endangered
                aquatic species have been found in the subwatershed containing
                this barrier.
              </li>
            </>
          ) : (
            <li>
              No federally-listed threatened and endangered aquatic species have
              been identified by available data sources for this subwatershed.
            </li>
          )}

          {statesgcnspp > 0 ? (
            <>
              <li>
                <b>{statesgcnspp}</b> state-listed aquatic species of greatest
                conservation need have been found in the subwatershed containing
                this barrier. These may include state-listed threatened and
                endangered species.
              </li>
            </>
          ) : (
            <li>
              No state-listed aquatic species of greatest conservation need have
              been identified by available data sources for this subwatershed.
            </li>
          )}

          {regionalsgcnspp > 0 ? (
            <>
              <li>
                <b>{regionalsgcnspp}</b> regionally-listed aquatic Species of
                Greatest Conservation Need (SGCN) have been found in the
                subwatershed containing this barrier.
              </li>
            </>
          ) : (
            <li>
              No regionally-listed aquatic Species of Greatest Conservation Need
              (SGCN) have been identified by available data sources for this
              subwatershed.
              <Paragraph variant="help" sx={{ mt: '1rem' }}>
                Species information is very incomplete; important species may
                not be represented within the available data.{' '}
                <a href="/sgcn" target="_blank">
                  Read more.
                </a>
              </Paragraph>
            </li>
          )}

          {tespp + statesgcnspp + regionalsgcnspp > 0 ? (
            <Paragraph variant="help" sx={{ mt: '1rem' }}>
              Note: species information is very incomplete. These species may or
              may not be directly impacted by this barrier.{' '}
              <a href="/sgcn" target="_blank">
                Read more.
              </a>
            </Paragraph>
          ) : null}
        </Box>
      </Box>

      {huc8_usfs + huc8_coa + huc8_sgcn > 0 && (
        <Box>
          <Text sx={{ fontWeight: 'bold' }}>Conservation Benefit</Text>
          <Box as="ul" sx={{ mt: '0.5rem' }}>
            {/* watershed priorities */}
            {huc8_usfs > 0 && (
              <li>
                Within USFS {HUC8_USFS[huc8_usfs]} priority watershed.{' '}
                <a href="/usfs_priority_watersheds" target="_blank">
                  Read more.
                </a>
              </li>
            )}
            {huc8_coa > 0 && (
              <li>
                Within a SARP conservation opportunity area.{' '}
                <OutboundLink to="https://southeastaquatics.net/sarps-programs/usfws-nfhap-aquatic-habitat-restoration-program/conservation-opportunity-areas">
                  Read more.
                </OutboundLink>
              </li>
            )}
            {huc8_sgcn > 0 && (
              <li>
                Within one of the top 10 watersheds in this state based on
                number of state-listed Species of Greatest Conservation Need.{' '}
                <a href="/sgcn" target="_blank">
                  Read more.
                </a>
              </li>
            )}
          </Box>
        </Box>
      )}

      {!isEmptyString(source) || !isCrossing ? (
        <>
          <Text sx={{ fontWeight: 'bold' }}>Other information</Text>
          <Box as="ul" sx={{ mt: '0.5rem' }}>
            {!isCrossing ? (
              <li>
                SARP ID: {sarpid} (data version: {dataVersion})
              </li>
            ) : null}

            {!isEmptyString(source) ? <li>Source: {source}</li> : null}
          </Box>
        </>
      ) : null}
    </Box>
  )
}

BarrierDetails.propTypes = {
  sarpid: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  hasnetwork: PropTypes.bool.isRequired,
  excluded: PropTypes.bool,
  source: PropTypes.string,
  stream: PropTypes.string,
  intermittent: PropTypes.string,
  HUC8: PropTypes.string,
  HUC12: PropTypes.string,
  HUC8Name: PropTypes.string,
  HUC12Name: PropTypes.string,
  road: PropTypes.string,
  roadtype: PropTypes.string,
  crossingtype: PropTypes.string,
  condition: PropTypes.string,
  severityclass: PropTypes.number,
  tespp: PropTypes.number,
  statesgcnspp: PropTypes.number,
  regionalsgcnspp: PropTypes.number,
  ownertype: PropTypes.number,
  huc8_usfs: PropTypes.number,
  huc8_coa: PropTypes.number,
  huc8_sgcn: PropTypes.number,
  freeupstreammiles: PropTypes.number,
  totalupstreammiles: PropTypes.number,
  freedownstreammiles: PropTypes.number,
  totaldownstreammiles: PropTypes.number,
  landcover: PropTypes.number,
  sizeclasses: PropTypes.number,
}

BarrierDetails.defaultProps = {
  HUC8: null,
  HUC12: null,
  HUC8Name: null,
  HUC12Name: null,
  excluded: false,
  source: null,
  stream: null,
  intermittent: false,
  road: null,
  roadtype: null,
  crossingtype: null,
  severityclass: null,
  condition: null,
  tespp: 0,
  statesgcnspp: 0,
  regionalsgcnspp: 0,
  ownertype: null,
  huc8_usfs: 0,
  huc8_coa: 0,
  huc8_sgcn: 0,
  freeupstreammiles: null,
  totalupstreammiles: null,
  freedownstreammiles: null,
  totaldownstreammiles: null,
  landcover: null,
  sizeclasses: null,
}

export default BarrierDetails
