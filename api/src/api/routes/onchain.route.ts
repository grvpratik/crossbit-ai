import { Router } from 'express'
import { asyncHandler } from '../../middleware/error.middleware'
import {
  getBondingCurveStateEndpoint,
  getStaticTokenMetaDataEndpoint,
  getTokenHoldersEndpoint,
  getTokenPriceEndpoint,
  getTokenVolumeEndpoint,
} from '../controllers/onchain.controller'

const router = Router()

router.get('/token/:ca/static', asyncHandler(getStaticTokenMetaDataEndpoint))

router.get('/token/:ca/volume', asyncHandler(getTokenVolumeEndpoint))

router.get('/token/:ca/price', asyncHandler(getTokenPriceEndpoint))

router.get('/token/:ca/holders', asyncHandler(getTokenHoldersEndpoint))

router.get('/token/:ca/curve', asyncHandler(getBondingCurveStateEndpoint))

// router.get(
//   '/token/:ca/dynamic',
//   asyncHandler(getDynamicTokenData)
// )
//mint check(static)
// creator history(static)
// holders(dynamic)
// volume(dynamic)
// similar tokens(static)
// holders connection and bundles(dynamic and static)
//
export default router
