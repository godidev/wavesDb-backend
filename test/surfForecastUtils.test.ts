import { describe, it, expect } from 'vitest'
import { getDate, parseForecast } from '../src/utils/surf-forecast.service'

describe('getDate', () => {
  it('parses AM correctly', () => {
    expect(getDate('Tue 06 2AM')).toEqual([6, 2])
    expect(getDate('Tue 06 12AM')).toEqual([6, 0])
  })

  it('parses PM correctly', () => {
    expect(getDate('Tue 06 2PM')).toEqual([6, 14])
    expect(getDate('Tue 06 12PM')).toEqual([6, 12])
  })
})

describe('parseForecast', () => {
  it('parses HTML and returns wave data', async () => {
    const mockHtml = `
      <table>
        <tr>
          <td class="forecast-table__cell forecast-table-wave-graph__cell" data-date="Tue 06 2PM" data-swell-state='[{"period": 10, "angle": 270, "height": 1.5}]' data-wind='{"speed": 10, "direction": {"angle": 180}}'></td>
          <td class="forecast-table__cell forecast-table-energy__cell"><strong>500</strong></td>
        </tr>
      </table>
    `
    const beachSpot = 'test-spot'
    const result = await parseForecast(beachSpot, mockHtml)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      validSwells: [{ angle: 90, height: 1.5, period: 10 }],
      wind: { speed: 10, angle: 360 },
      energy: 500,
    })
    expect(result[0].date).toBeInstanceOf(Date)
  })
})
