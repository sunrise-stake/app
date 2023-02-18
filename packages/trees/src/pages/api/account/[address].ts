import { NextApiRequest, NextApiResponse } from 'next'
import request from 'got-cjs'

import { addUp, isBase58, toTimestamp as toTS } from '@/utils'

const getDBData = (collection, type, address) => request.post(
  `${process.env.MONGODB_API_URL}/action/find`,
  {
    headers: {
      'api-key': process.env.MONGODB_READ_TOKEN,
    },
    json: {
      dataSource: 'Cluster0',
      database: 'gsol-tracker',
      collection,
      filter: {
        [type]: address,
      }
    },
  }
).json()

const getAccountMints = (address) => getDBData('mints', 'recipient', address)
  .then((resp: any) => resp.documents)
const getAccountReceivals = (address) => getDBData('transfers', 'recipient', address)
  .then((resp: any) => resp.documents)
const getAccountSendings = (address) => getDBData('transfers', 'sender', address)
  .then((resp: any) => resp.documents)

const getNeighbors = (sendings) => {
  let neighbors = {}
  sendings.map((sending) => {
    if (sending.sender === sending.recipient) return

    if (!neighbors[sending.recipient]) neighbors[sending.recipient] = {}

    if (
      (
        neighbors[sending.recipient].firstSendingDate
        && toTS(sending.timestamp) < toTS(neighbors[sending.recipient].firstSendingDate)
      )
      || !neighbors[sending.recipient].firstSendingDate
    ) {
      neighbors[sending.recipient].firstSendingDate = sending.timestamp
    }

    if (neighbors[sending.recipient].amountTotal != null) {
      neighbors[sending.recipient].amountTotal += sending.amount
    } else {
      neighbors[sending.recipient].amountTotal = sending.amount
    }
  })

  return neighbors
}

const getTotals = (mints, receivals, sendings) => {
  const amountMinted = addUp('amount', mints)
  const amountReceived = addUp('amount', receivals)
  const amountSent = addUp('amount', sendings)

  const countMints = mints.length
  const countReceivals = receivals.filter(r => r.sender !== r.recipient).length
  const countSendings = receivals.filter(s => s.sender !== s.recipient).length

  const uniqueSenders = new Set()
  receivals.forEach(r => r.sender !== r.recipient ? uniqueSenders.add(r.sender) : null)

  const uniqueRecipients = new Set()
  sendings.forEach(s => s.sender !== s.recipient ? uniqueRecipients.add(s.recipient) : null)

  return {
    amountMinted,
    amountReceived,
    amountSent,
    countMints,
    countReceivals,
    countSendings,
    uniqueRecipients: Array.from(uniqueRecipients),
    uniqueSenders: Array.from(uniqueSenders),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query

  if (!isBase58(address)) return res.status(400).json({})

  const [mints, received, sent] = await Promise.all([
    getAccountMints(address),
    getAccountReceivals(address),
    getAccountSendings(address),
  ])
  const neighbors = getNeighbors(sent)
  const totals = getTotals(mints, received, sent)

  res.json({
    address,
    mints,
    sent,
    received,
    neighbors,
    totals,
  })
}
