# jquery.collapsable

## Instalace

Do závislostí projektu je možné plugin přidat přes odkaz na Github následovně (více viz: http://bower.io/docs/creating-packages/#dependencies):

```
$ cat bower.json
{
	"name": "Projekt",
	"private": true,
	"dependencies": {
		"jquery.collapsable": "peckadesign/jquery.collapsable#1.0.*"
	}
}
```

## Changelog

### v1.1.0

- přejmenování `fxSpeed` na `collapseDelay`, nově lze použít i bez `fx`, v tu chvíli nastavuje zpoždění mezi `onExpand/onCollapse` a `onExpanded/onCollapsed`
- oprava výchozího otevírání boxů při načtení stránky dle class a kotvy v url
- úprava callbacků při kliku na `ca-control` prvky; místo `return false;` nově `e.preventDefault()`, díky tomu lze načítat obsah boxů ajaxem (nezablokuje odeslání požadavku)
- přidána podpora pd extension `spinner` (pokud je)
