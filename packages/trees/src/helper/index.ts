const fetcher = url => fetch(url).then(r => r.json())

export {
  fetcher,
}
