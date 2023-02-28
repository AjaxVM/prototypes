export interface IObjectWithExtraProps {
  [x: string]: any
}

export const getValueFromPath = (source: IObjectWithExtraProps, path: string[]): any => {
  return path.reduce((_source, key) => _source?.[key], source)
}

export const getValue = (source: IObjectWithExtraProps, target: string): any => {
  return getValueFromPath(source, target.split('.'))
}

export const hasProperty = (source: IObjectWithExtraProps, target: string): boolean => {
  const path = target.split('.')
  const field = path[path.length - 1]
  const objPath = path.slice(0, -1)
  const obj = getValueFromPath(source, objPath)
  return obj != null && Object.prototype.hasOwnProperty.call(obj, field)
}
