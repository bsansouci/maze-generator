//#pragma strict
import SimpleJSON;

var Room : Transform;

function toggleVisibility(obj, state)
 {
  obj.renderer.enabled = state;
//   if (obj.guiTexture != null)
//       obj.guiTexture.enabled = state;
//   if (obj.guiText != null)
//       obj.guiText.enabled = state;
 }

function Start () {
  var url = "http://104.236.205.198:3000/";
  var www : WWW = new WWW (url);
  yield www;
  var space = Array(JSON.Parse(www.text)['space']);
  Debug.LogError(space.length);

  var offsetX = 2.755437;
  var offsetY = 1.739833;
  var offsetZ = 120;
  var moveByOne = 3.5;
  var scaleY = 2;

  for(var i = 0; i < space.length; i++) {
    for(var j = 0; j < Array(space[i]).length; j++) {
      var o = Instantiate(Room, Vector3 (offsetX + moveByOne * i, offsetY * scaleY, offsetZ - moveByOne * j), Quaternion.identity);
//      var bla: Transform[] = o.GetComponentInChildren();
//      Debug.LogError(o.transform.GetChild(0).gameObject.active);
//      Room.transform.GetChild(0).gameObject.active = true;
//      o.transform.GetChild(0).gameObject.SetActive(false);
    Debug.LogError(space[i][j]['north'] + " -- " +  (String.Compare(space[i][j]['north'], "true") == 0));
      o.transform.GetChild(0).gameObject.SetActive(String.Compare(space[i][j]['north'], "true") == 0);
      o.transform.GetChild(1).gameObject.SetActive(String.Compare(space[i][j]['west'], "true") == 0);
      o.transform.GetChild(2).gameObject.SetActive(String.Compare(space[i][j]['east'], "true") == 0);
      o.transform.GetChild(3).gameObject.SetActive(String.Compare(space[i][j]['south'], "true") == 0);
    }
  }
//  Instantiate(Room, Vector3 (3.5 + offsetX, 1, 0 + offsetZ), Quaternion.identity);
}

function Update () {
}