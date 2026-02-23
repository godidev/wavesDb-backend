import { describe, it, expect } from 'vitest'
import {
  getGeneralDate,
  getHourlyDate,
  parseHourlyForecast,
} from '../src/utils/surf-forecast.service'

describe('getHourlyDate', () => {
  it('parses AM correctly', () => {
    expect(getHourlyDate('Tue 06 2AM')).toEqual([6, 2])
    expect(getHourlyDate('Tue 06 12AM')).toEqual([6, 0])
  })

  it('parses PM correctly', () => {
    expect(getHourlyDate('Tue 06 2PM')).toEqual([6, 14])
    expect(getHourlyDate('Tue 06 12PM')).toEqual([6, 12])
  })
})

describe('getGeneralDate', () => {
  it('parses general day periods correctly', () => {
    expect(getGeneralDate('Tue 06 mañana')).toEqual([6, 10])
    expect(getGeneralDate('Tue 06 tarde')).toEqual([6, 16])
    expect(getGeneralDate('Tue 06 noche')).toEqual([6, 22])
  })
})

describe('parseHourlyForecast', () => {
  it('parses HTML and returns wave data', async () => {
    const mockHtml = `
      <table>
        <tr>
          <td
            class="forecast-table__cell forecast-table-wave-height__cell"
            data-date="Tue 06 2PM"
            data-swell-state='[{"period": 10, "angle": 270, "height": 1.5}]'
            data-wind='{"speed": 10, "direction": {"angle": 180}}'
            data-swell-energies='[{"value":500,"colors":{"background":"#000","text":"#fff"}}]'
          ></td>
        </tr>
      </table>
    `
    const spotId = 'a3f9f8b5-7f9f-4c8b-b6ef-9917d4db1949'
    const spotName = 'test-spot'
    const result = await parseHourlyForecast(spotId, spotName, mockHtml)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      spotId,
      source: 'hourly_48h',
      validSwells: [{ angle: 90, height: 1.5, period: 10 }],
      wind: { speed: 10, angle: 360 },
      energy: 500,
    })
    expect(result[0].date).toBeInstanceOf(Date)
  })
})
